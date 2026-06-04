import React from "react";
import { Heading, Grid } from "../../../../components/shared/Common_Components";
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

        {/* ── Content ── */}
        <div className="col-span-12">
          <DailyCoordination />
        </div>
      </Grid>
    </div>
  );
}
