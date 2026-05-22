import { useState } from "react";
import { Heading } from "../../../components/shared/Common_Components.jsx";
import { projects as initialProjects } from "./managementManagerStore";
import AllProjects from "./projects/AllProjects";

export default function ManagementManagerProjects() {
  const [projects, setProjects] = useState(initialProjects);

  const updateProject = (id, patch) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addProject = (project) =>
    setProjects((prev) => [project, ...prev]);

  return (
    <div className="flex flex-col gap-6">
      <Heading primaryText="Project" secondaryText="Management" size={12} />
      <AllProjects
        projects={projects}
        updateProject={updateProject}
        addProject={addProject}
      />
    </div>
  );
}
