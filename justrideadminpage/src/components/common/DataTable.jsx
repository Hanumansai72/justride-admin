import React from 'react';
import './DataTable.css';

export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  pagination = {
    current: 1,
    totalCount: 0,
    pageSize: 10,
    onPrev: () => {},
    onNext: () => {},
  },
}) {
  return (
    <div className="custom-datatable-card">
      <div className="table-scroll-container">
        <table className="custom-datatable">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={col.width ? { width: col.width } : {}}
                  className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data-cell">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="table-data-row"
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : ''
                      }
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="table-pagination-bar">
          <span className="pagination-info">
            Showing <span className="text-highlight">1-{data.length}</span> of{' '}
            <span className="text-highlight">{pagination.totalCount || data.length}</span> records
          </span>

          <div className="pagination-btn-group">
            <button
              type="button"
              className="page-btn"
              disabled={pagination.current === 1}
              onClick={pagination.onPrev}
            >
              <span className="material-symbols-outlined icon-18">chevron_left</span>
            </button>
            <button type="button" className="page-btn active">
              {pagination.current}
            </button>
            <button
              type="button"
              className="page-btn"
              onClick={pagination.onNext}
            >
              <span className="material-symbols-outlined icon-18">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
