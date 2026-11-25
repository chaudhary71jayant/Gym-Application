import { useState } from "react";
import Sidebar from "./SideBar";
import Header from "./Header";

const DashboardLayout = ({ children, title, subtitle, actions }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          actions={actions}
          isMobileOpen={isMobileOpen}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        <main className="flex-1 pt-20 pb-10 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] mx-auto">
          {actions && (
            <div className="flex md:hidden items-center justify-end gap-2 mb-4">
              {actions}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
