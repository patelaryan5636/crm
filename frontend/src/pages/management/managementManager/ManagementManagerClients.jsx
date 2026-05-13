import { useState } from "react";
import { Eye, Phone, Mail, Link as LinkIcon } from "lucide-react";
import {
  Heading,
  Grid,
  DataTable,
  Modal,
  ModalProfile,
  ModalGrid,
  ModalData,
  Button,
  openModal,
  closeModal,
} from "../../../components/shared/Common_Components";
import { clients, clientKPIs } from "./clientsStore";

export default function ManagementManagerClients() {
  const [selectedClient, setSelectedClient] = useState(null);

  const handleViewClient = (client) => {
    setSelectedClient(client);
    openModal("mm-client-view");
  };

  return (
    <div>
      <Grid cols={12} gap={4}>
        <Heading
          primaryText="Clients"
          secondaryText="Manage all clients and their projects"
          size={12}
        />
      </Grid>

      <Grid cols={12} gap={4}>
        <DataTable
          title="All Clients"
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Client Name" },
            { key: "mobile", label: "Mobile" },
            { key: "email", label: "Email" },
            { key: "projectIds", label: "Active Projects" },
          ]}
          rows={clients.map((c) => ({
            ...c,
            projectIds: c.projectIds.length,
          }))}
          size={12}
          pageSize={10}
          searchable
          exportable
          exportFileName="clients_export"
          actions={[
            {
              icon: <Eye size={15} />,
              tooltip: "View Projects",
              variant: "ghost",
              onClick: (row) => handleViewClient(row),
            },
          ]}
        />
      </Grid>

      {/* View Client Modal */}
      <Modal id="mm-client-view" title="Client Details" size="lg">
        {selectedClient && (
          <>
            <ModalProfile
              name={selectedClient.name}
              subtitle={selectedClient.id}
              meta={`Mobile · ${selectedClient.mobile}`}
            />
            <ModalGrid title="Contact Information" cols={2}>
              <ModalData label="Mobile" value={selectedClient.mobile} />
              <ModalData label="Email" value={selectedClient.email} />
              <ModalData
                label="Drive Link"
                value={
                  <a
                    href={selectedClient.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon size={14} /> Open Drive
                  </a>
                }
              />
            </ModalGrid>

            <ModalGrid title="Associated Projects" cols={1}>
              <div className="bg-slate-50 rounded p-3 text-sm">
                <div className="font-semibold mb-2">
                  {selectedClient.projectIds.length} Project(s)
                </div>
                <div className="space-y-1">
                  {selectedClient.projectIds.map((pid) => (
                    <div key={pid} className="text-slate-600">
                      • {pid}
                    </div>
                  ))}
                </div>
              </div>
            </ModalGrid>

            <Button
              text="Close"
              variant="ghost"
              size={3}
              onClick={() => closeModal("mm-client-view")}
            />
          </>
        )}
      </Modal>
    </div>
  );
}