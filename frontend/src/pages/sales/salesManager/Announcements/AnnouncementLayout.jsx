import { useState } from "react";
import Announcements from "./Announcements";
import { initialAnnouncements } from "./AnnouncementStore";

export default function AnnouncementLayout() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);

  return (
    <div className="flex flex-col gap-6">
      <Announcements
        announcements={announcements}
        setAnnouncements={setAnnouncements}
      />
    </div>
  );
}
