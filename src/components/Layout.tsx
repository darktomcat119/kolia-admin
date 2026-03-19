import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#F8F7F5]">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
