import React, { useState, useEffect, useMemo } from 'react';
import { GridApi, ColumnState } from 'ag-grid-community';

export interface ColumnChooserProps {
  isOpen: boolean;
  onClose: () => void;
  gridApi: GridApi | null | undefined;
}

interface ColumnItem {
  colId: string;
  headerName: string;
}

export const CustomColumnChooser: React.FC<ColumnChooserProps> = ({
  isOpen,
  onClose,
  gridApi,
}) => {
  const [availableCols, setAvailableCols] = useState<ColumnItem[]>([]);
  const [visibleCols, setVisibleCols] = useState<ColumnItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Read state from AG Grid when modal opens
  useEffect(() => {
    if (isOpen && gridApi) {
      const allColumns = gridApi.getColumns() || [];
      const colState = gridApi.getColumnState();

      const visible: ColumnItem[] = [];
      const available: ColumnItem[] = [];

      // Map columns based on their current visibility state
      allColumns.forEach((col) => {
        const colDef = col.getColDef();
        const state = colState.find((s) => s.colId === col.getColId());
        const item: ColumnItem = {
          colId: col.getColId(),
          headerName: colDef.headerName || colDef.field || col.getColId(),
        };

        if (state && !state.hide) {
          visible.push(item);
        } else {
          available.push(item);
        }
      });

      setVisibleCols(visible);
      setAvailableCols(available);
      setSearchTerm('');
    }
  }, [isOpen, gridApi]);

  // 2. Filter available columns based on search
  const filteredAvailableCols = useMemo(() => {
    return availableCols.filter((col) =>
      col.headerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCols, searchTerm]);

  // 3. Movement Handlers
  const moveToVisible = (col: ColumnItem) => {
    setAvailableCols((prev) => prev.filter((c) => c.colId !== col.colId));
    setVisibleCols((prev) => [...prev, col]);
  };

  const moveToAvailable = (col: ColumnItem) => {
    setVisibleCols((prev) => prev.filter((c) => c.colId !== col.colId));
    setAvailableCols((prev) => [...prev, col]);
  };

  const moveAllToVisible = () => {
    setVisibleCols((prev) => [...prev, ...filteredAvailableCols]);
    setAvailableCols((prev) =>
      prev.filter((c) => !filteredAvailableCols.includes(c))
    );
  };

  const moveAllToAvailable = () => {
    setAvailableCols((prev) => [...prev, ...visibleCols]);
    setVisibleCols([]);
  };

  // 4. Apply Changes to AG Grid v32
  const handleApply = () => {
    if (!gridApi) return;

    const newColumnState: ColumnState[] = [];

    // Map visible columns (maintaining the new order they appear in the right list)
    visibleCols.forEach((col, index) => {
      newColumnState.push({ colId: col.colId, hide: false });
    });

    // Map hidden columns
    availableCols.forEach((col) => {
      newColumnState.push({ colId: col.colId, hide: true });
    });

    gridApi.applyColumnState({
      state: newColumnState,
      applyOrder: true, // Applies the order based on the visible list
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="uds-modal-backdrop">
      <div className="uds-modal-content d-flex flex-column">
        <div className="modal-header">
          <h3>Custom Column Settings</h3>
        </div>

        <div className="modal-body d-flex flex-row gap-3">
          {/* Left Panel: Available Columns */}
          <div className="chooser-panel flex-grow-1 border p-2">
            <div className="d-flex justify-content-between mb-2">
              <strong>Available columns</strong>
              <button onClick={moveAllToVisible} className="btn btn-link btn-sm">Add all</button>
            </div>
            <input
              type="text"
              placeholder="Find..."
              className="form-control mb-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredAvailableCols.map((col) => (
                <li key={col.colId} className="list-group-item d-flex justify-content-between align-items-center">
                  {col.headerName}
                  <button onClick={() => moveToVisible(col)} className="btn btn-sm btn-light">+</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Panel: Visible Columns */}
          <div className="chooser-panel flex-grow-1 border p-2">
            <div className="d-flex justify-content-between mb-2">
              <strong>Visible columns</strong>
              <button onClick={moveAllToAvailable} className="btn btn-link btn-sm">Clear all</button>
            </div>
            <ul className="list-group" style={{ maxHeight: '335px', overflowY: 'auto' }}>
              {visibleCols.map((col) => (
                <li key={col.colId} className="list-group-item d-flex justify-content-between align-items-center">
                  {col.headerName}
                  <button onClick={() => moveToAvailable(col)} className="btn btn-sm btn-light">-</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modal-footer mt-3 d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleApply} className="btn btn-primary">Apply</button>
        </div>
      </div>
    </div>
  );
};
