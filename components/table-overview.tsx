import { TableCard } from '@/components/service-ui';
import { Button } from '@/components/ui/button';
import {
  roomForTable,
  type Reservation,
  type RestaurantTable,
  type TableStatus,
} from '@/lib/restaurant';
import type { Translate } from '@/lib/i18n';

export type TableGrouping = 'room' | 'area';
export type TableFilter = 'all' | TableStatus;

const statusFilters: TableFilter[] = [
  'all',
  'available',
  'occupied',
  'reserved',
  'cleaning',
];

export function TableGroupingSwitch({
  grouping,
  onGroupingChange,
  t,
}: {
  grouping: TableGrouping;
  onGroupingChange: (grouping: TableGrouping) => void;
  t: Translate;
}) {
  return (
    <fieldset className="grouping-switch">
      <legend className="sr-only">{t('tables.organize')}</legend>
      {(['room', 'area'] as const).map((option) => (
        <Button
          key={option}
          variant="quinary"
          aria-pressed={grouping === option}
          className={grouping === option ? 'selected' : ''}
          onClick={() => onGroupingChange(option)}
        >
          {t(option === 'room' ? 'tables.byRoom' : 'tables.byArea')}
        </Button>
      ))}
    </fieldset>
  );
}

export function TableOverview({
  tables,
  reservations,
  now,
  grouping,
  statusFilter,
  onStatusFilterChange,
  onOpenTable,
  t,
}: {
  tables: RestaurantTable[];
  reservations: Reservation[];
  now: number;
  grouping: TableGrouping;
  statusFilter: TableFilter;
  onStatusFilterChange: (status: TableFilter) => void;
  onOpenTable: (id: string) => void;
  t: Translate;
}) {
  const visibleTables = tables.filter(
    (table) => statusFilter === 'all' || table.status === statusFilter,
  );

  // Group definitions stay explicit so the restaurant can rename or reorder
  // rooms later without changing the stored table records.
  const groups =
    grouping === 'room'
      ? (['terrace', 'main', 'side'] as const).map((key) => ({
          key,
          label: t(`room.${key}`),
          tables: visibleTables.filter((table) => roomForTable(table) === key),
        }))
      : (['indoor', 'outdoor'] as const).map((key) => ({
          key,
          label: t(`area.${key}`),
          tables: visibleTables.filter((table) => table.area === key),
        }));

  return (
    <>
      <div className="table-toolbar">
        <fieldset className="table-filters">
          <legend className="sr-only">{t('tables.filter')}</legend>
          {statusFilters.map((filter) => {
            const label =
              filter === 'all' ? t('tables.all') : t(`status.${filter}`);
            const count =
              filter === 'all'
                ? tables.length
                : tables.filter((table) => table.status === filter).length;
            return (
              <Button
                key={filter}
                variant="quinary"
                aria-pressed={statusFilter === filter}
                aria-label={`${label}, ${t('tables.inGroup', { count })}`}
                className={`status-filter filter-${filter} ${statusFilter === filter ? 'selected' : ''}`}
                onClick={() => onStatusFilterChange(filter)}
              >
                {label}
                <span className="filter-count">{count}</span>
              </Button>
            );
          })}
        </fieldset>
      </div>
      <div className="table-groups">
        {groups.map((group) => (
          <section className="table-group" key={group.key}>
            <div className="table-group-heading">
              <h3>{group.label}</h3>
              <span>{t('tables.inGroup', { count: group.tables.length })}</span>
            </div>
            {group.tables.length ? (
              <div className="table-grid">
                {group.tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    now={now}
                    reservation={reservations.find(
                      (reservation) => reservation.id === table.reservationId,
                    )}
                    onClick={() => onOpenTable(table.id)}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <p className="table-group-empty">
                {t('tables.emptyStatus', {
                  status:
                    statusFilter === 'all'
                      ? t('tables.all').toLowerCase()
                      : t(`status.${statusFilter}`).toLowerCase(),
                })}
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
