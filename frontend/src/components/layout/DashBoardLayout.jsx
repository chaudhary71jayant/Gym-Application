import Sidebar from "./SideBar";
import Header from "./Header";

const DashboardLayout = ({children, title}) => {
     return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Sidebar — fixed on the left */}
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="ml-64">

        {/* Header — fixed at the top */}
        <Header title={title} />

        {/* Page content — offset by header height */}
        <main className="pt-16 p-6">
          {children}
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;