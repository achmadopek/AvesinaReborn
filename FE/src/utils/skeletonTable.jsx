import React from "react";
import PropTypes from "prop-types";
import "../App.css";

const SkeletonTable = ({
  rows = 10,
  cols = 5,
  rowHeight = 16,
  headerHeight = 20,
  animated = true,
  responsive = true,
}) => {
  const skeletonClass = animated ? "skeleton skeleton--animated" : "skeleton";

  // Buat array kolom otomatis sesuai jumlah cols
  const columns = Array.from({ length: cols });

  return (
    <div
      className="skeleton-table-wrapper"
      style={{ overflowX: responsive ? "auto" : "hidden" }}
    >
      <table className="skeleton-table">
        <thead>
          <tr>
            {columns.map((_, i) => (
              <th key={i}>
                <div
                  className={`${skeletonClass} skeleton-header`}
                  style={{ height: headerHeight }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {columns.map((_, c) => (
                <td key={c}>
                  <div
                    className={skeletonClass}
                    style={{ height: rowHeight }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  cols: PropTypes.number,
  rowHeight: PropTypes.number,
  headerHeight: PropTypes.number,
  animated: PropTypes.bool,
  responsive: PropTypes.bool,
};

export default SkeletonTable;
