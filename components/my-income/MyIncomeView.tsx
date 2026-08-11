"use client";

import { navItems, currentUser } from "@/app/data";
import { myIncomeRecords, formatInr } from "@/app/data/myIncome";
import { AppShell } from "@/components/layout/AppShell";

export function MyIncomeView() {
  const totalIncome = myIncomeRecords.reduce((sum, row) => sum + row.amount, 0);

  return (
    <AppShell navItems={navItems} user={currentUser}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Income
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            View your total earnings and income records.
          </p>
        </header>

        <section className="mt-8">
          <div className="rounded-xl bg-emerald-50 px-6 py-5 sm:px-8 sm:py-6">
            <p className="text-sm font-medium text-slate-600">Total Income</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-900 sm:text-4xl">
              {formatInr(totalIncome)}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Income History</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-100 text-sm font-semibold text-slate-700">
                  <th className="rounded-l-lg px-4 py-3.5 font-semibold">S/No</th>
                  <th className="px-4 py-3.5 font-semibold">Income Type</th>
                  <th className="px-4 py-3.5 font-semibold">Amount</th>
                  <th className="rounded-r-lg px-4 py-3.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {myIncomeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                      No income records yet.
                    </td>
                  </tr>
                ) : (
                  myIncomeRecords.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-4 text-sm text-slate-700">{index + 1}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {row.incomeType}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-800">
                        {formatInr(row.amount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{row.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
