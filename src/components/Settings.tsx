import React from 'react';
import { AccountSettings } from './AccountSettings';
import { CategorySettings } from './CategorySettings';
import { GoalSettings } from './GoalSettings';
import { DataManagement } from './DataManagement';
import { DashboardSettings } from './DashboardSettings';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">設定</h2>
        <p className="text-slate-500 mt-2">アプリの各種設定を行います。</p>
      </header>

      <div className="space-y-8">
        <section>
          <AccountSettings />
        </section>

        <section>
          <DashboardSettings />
        </section>

        <section>
          <CategorySettings />
        </section>

        <section>
          <GoalSettings />
        </section>

        <section>
          <DataManagement />
        </section>
      </div>
    </div>
  );
};
