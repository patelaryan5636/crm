import React from "react";
import { Heading, Grid } from "../../../../components/shared/Common_Components";
import TeamMembersTable from "./TeamMembersTable";
import DailyCoordination from "./DailyCoordination";

export default function TeamsPage() {
  return (
    <div>
      <Grid cols={12} gap={5}>
        {/* ── Heading ── */}
        <Heading
          primaryText="Team"
          secondaryText="Management"
          size={12}
          showAnimations={true}
        />

        {/* ── Team members table ── */}
        <div className="col-span-12">
          <TeamMembersTable />
        </div>

        {/* ── Daily coordination ── */}
        <div className="col-span-12">
          <DailyCoordination />
        </div>
      </Grid>
    </div>
  );
}
