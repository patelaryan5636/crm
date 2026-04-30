'use strict';

const { BulkUserUpload }   = require('../models');
const bulkUserUploadService = require('../services/bulkUserUpload.service');
const { uploadOptionsSchema, commitUploadSchema } = require('../validators/bulkUserUpload.validator');
const catchAsync   = require('../utils/catchAsync');
const ApiResponse  = require('../utils/apiResponse');
const AppError     = require('../utils/appError');

// ─────────────────────────────────────────────────────────────
// POST /api/users/bulk/upload
// Parse + validate the uploaded file and return a preview.
// Does NOT create any users.
// ─────────────────────────────────────────────────────────────
exports.uploadPreview = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded. Attach a CSV or Excel file as "file".', 400));
  }

  const { error, value } = uploadOptionsSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const fileType =
    req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')
      ? 'CSV'
      : 'EXCEL';

  // Persist upload metadata before any processing starts
  const newUpload = new BulkUserUpload({
    admin:         req.admin._id,
    uploadedBy:    req.user ? req.user._id : req.admin._id,
    uploadedByType: req.user ? 'USER' : 'ADMIN',
    fileType,
    fileName:  req.file.originalname,
    fileUrl:   req.file.path,
    options: {
      skipDuplicates: value.skipDuplicates,
      strictMode:     value.strictMode,
    },
  });
  await newUpload.save();

  // Run parse + validate (no inserts)
  const { upload, duplicateBreakdown, limitInfo } =
    await bulkUserUploadService.processUploadPreview(newUpload._id);

  res.status(200).json(
    new ApiResponse(200, {
      uploadId: upload._id,
      summary: {
        totalRows:          upload.totalRows,
        validRows:          upload.validRows,
        invalidRows:        upload.invalidRows,
        duplicates:         upload.duplicates,
        duplicateInFile:    duplicateBreakdown.inFile,
        duplicateInDb:      duplicateBreakdown.inDb,
        status:             upload.status,
        // User-limit info — lets the frontend warn before commit
        effectiveUserLimit:  limitInfo.effectiveUserLimit,
        currentActiveUsers:  limitInfo.currentActiveUsers,
        allowedImportSlots:  limitInfo.allowedImportSlots,
        wouldExceedUserLimit: limitInfo.wouldExceedUserLimit,
      },
      // Return first 50 row errors for the UI preview table
      previewErrors: upload.failedRows.slice(0, 50),
    }, 'Preview generated successfully'),
  );
});

// ─────────────────────────────────────────────────────────────
// POST /api/users/bulk/:uploadId/commit
// Admin confirms import — users are created for valid rows.
// ─────────────────────────────────────────────────────────────
exports.commitUpload = catchAsync(async (req, res, next) => {
  const { uploadId } = req.params;

  const { error, value } = commitUploadSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Ownership check — prevent cross-tenant access
  const upload = await BulkUserUpload.findOne({ _id: uploadId, admin: req.admin._id });
  if (!upload) {
    return next(new AppError('Upload not found', 404));
  }

  const result = await bulkUserUploadService.commitUpload(
    uploadId,
    value.importMode, // 'VALID_ONLY' | 'FAIL_ON_ANY_ERROR'
  );

  res.status(200).json(
    new ApiResponse(200, {
      uploadId:      result._id,
      importedCount: result.imported,
      failedCount:   result.failedRows.length,
      duplicateCount: result.duplicates,
      status:        result.status,
      startedAt:     result.startedAt,
      completedAt:   result.completedAt,
      errorsAvailable: result.failedRows.length > 0,
    }, 'Upload committed successfully'),
  );
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/bulk/:uploadId/status
// Returns current job counters and lifecycle status.
// ─────────────────────────────────────────────────────────────
exports.getStatus = catchAsync(async (req, res, next) => {
  const { uploadId } = req.params;

  const upload = await BulkUserUpload
    .findOne({ _id: uploadId, admin: req.admin._id })
    .select('-failedRows -errorMessages'); // exclude heavy arrays

  if (!upload) {
    return next(new AppError('Upload not found', 404));
  }

  res.status(200).json(new ApiResponse(200, upload, 'Status retrieved successfully'));
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/bulk/:uploadId/errors
// Streams a CSV of all failed rows for the given upload.
// ─────────────────────────────────────────────────────────────
exports.downloadErrors = catchAsync(async (req, res, next) => {
  const { uploadId } = req.params;

  const upload = await BulkUserUpload.findOne({ _id: uploadId, admin: req.admin._id });
  if (!upload) {
    return next(new AppError('Upload not found', 404));
  }

  if (!upload.failedRows || upload.failedRows.length === 0) {
    return next(new AppError('No errors found for this upload', 400));
  }

  const csvContent = bulkUserUploadService.generateErrorCsv(upload.failedRows);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=errors-${uploadId}.csv`);
  res.status(200).send(csvContent);
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/bulk/template
// Returns a downloadable CSV template with required + optional columns.
// ─────────────────────────────────────────────────────────────
exports.downloadTemplate = catchAsync(async (_req, res) => {
  // Columns: required only
  const header = 'name,email,phone,department,role\n';
  const sample =
    'Rahul Sharma,rahul.sharma@example.com,9876543210,SALES,SALES_EXECUTIVE\n' +
    'Priya Mehta,priya.mehta@example.com,9123456789,FINANCE,FINANCE_MANAGER\n' +
    'Arjun Rao,arjun.rao@example.com,9000011111,MANAGEMENT,MANAGEMENT_EMPLOYEE\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bulk-user-template.csv');
  res.status(200).send(header + sample);
});
