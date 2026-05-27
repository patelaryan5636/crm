const { Lead } = require("../models/index");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ApiResponse = require("../utils/apiResponse");

// Mapping backend status to frontend strings
const mapStatus = (status) => {
  const map = {
    UNTOUCHED: "New",
    TALK: "Contacted",
    NOT_TALK: "Not Interested",
    INTERESTED: "Interested",
    CONVERTED: "Won",
    DUMP: "Lost",
  };
  return map[status] || status;
};

// Generate initials for avatar
const generateAvatar = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

exports.getAdminLeads = catchAsync(async (req, res, next) => {
  // Use req.admin._id to fetch tenant-scoped leads
  const leads = await Lead.find({
    admin: req.admin._id,
    isDumped: false,
  })
    .populate("client", "name email mobile source")
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name")
    .sort({ createdAt: -1 });

  const formattedLeads = leads.map((lead) => {
    const clientName = lead.client?.name || "Unknown Client";

    // Formatting date helper
    const formatDate = (date) => {
      if (!date) return "—";
      const d = new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return {
      id: lead._id.toString(),
      name: clientName,
      mobile: lead.client?.mobile || "N/A",
      email: lead.client?.email || "N/A",
      source: lead.client?.source || "Manual",
      status: mapStatus(lead.status),
      owner: lead.assignedTo?.name || "Unassigned",
      value: "N/A", // will use the prospect form data
      lastContact: formatDate(lead.lastContactedAt),
      nextFollowup: formatDate(lead.followUpAt),
      avatar: generateAvatar(clientName),
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { leads: formattedLeads },
        "Leads fetched successfully",
      ),
    );
});
