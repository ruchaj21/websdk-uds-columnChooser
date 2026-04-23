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

export const CustomColumnChooser: React.FC<ColumnChooserProps> = ({ isOpen, onClose, gridApi }) => {
  const [availableCols, setAvailableCols] = useState<ColumnItem[]>([]);
  const [visibleCols, setVisibleCols] = useState<ColumnItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const loadCurrentGridState = () => {
    if (!gridApi) return;
    const allColumns = gridApi.getColumns() || [];
    const colState = gridApi.getColumnState();
    
    const visible: ColumnItem[] = [];
    const available: ColumnItem[] = [];

    colState.forEach((stateItem) => {
      const col = allColumns.find(c => c.getColId() === stateItem.colId);
      if (!col) return;
      
      const colDef = col.getColDef();
      const headerName = colDef.headerName || colDef.field || col.getColId();
      const item: ColumnItem = { colId: col.getColId(), headerName };

      if (stateItem.hide) {
        available.push(item);
      } else {
        visible.push(item);
      }
    });

    setVisibleCols(visible);
    setAvailableCols(available);
    setSearchTerm("");
  };

  // Load state when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentGridState();
    }
  }, [isOpen, gridApi]);

  const filteredAvailableCols = useMemo(() => {
    return availableCols.filter((col) =>
      col.headerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCols, searchTerm]);

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
    setAvailableCols((prev) => prev.filter((c) => !filteredAvailableCols.includes(c)));
  };

  const moveAllToAvailable = () => {
    setAvailableCols((prev) => [...prev, ...visibleCols]);
    setVisibleCols([]);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setVisibleCols((prev) => {
      const newCols = [...prev];
      [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
      return newCols;
    });
  };

  const moveDown = (index: number) => {
    if (index === visibleCols.length - 1) return;
    setVisibleCols((prev) => {
      const newCols = [...prev];
      [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
      return newCols;
    });
  };

  const handleApply = () => {
    if (!gridApi) return;

    // The robust exhaustive state mapping!
    const exhaustiveColumnState: ColumnState[] = [];

    visibleCols.forEach((col) => {
      exhaustiveColumnState.push({ colId: col.colId, hide: false });
    });

    availableCols.forEach((col) => {
      exhaustiveColumnState.push({ colId: col.colId, hide: true });
    });

    gridApi.applyColumnState({
      state: exhaustiveColumnState,
      applyOrder: true,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .custom-chooser-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
        }
        .custom-chooser-modal {
          background: #f4f4f4;
          width: 650px;
          border: 1px solid #a0a0a0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
        }
        .custom-chooser-header {
          padding: 12px 16px;
          border-bottom: 1px solid #d0d0d0;
          font-size: 14px;
          color: #333;
        }
        .custom-chooser-body {
          padding: 16px;
          display: flex;
          gap: 20px;
          background: #ececec;
        }
        .chooser-column {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .chooser-col-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 8px;
          font-size: 13px;
          color: #555;
        }
        .chooser-link-btn {
          background: none;
          border: none;
          color: #006699;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
        }
        .chooser-link-btn:hover {
          text-decoration: underline;
        }
        .chooser-list-container {
          background: #fff;
          border: 1px solid #bbb;
          height: 300px;
          display: flex;
          flex-direction: column;
        }
        .chooser-search {
          border: none;
          border-bottom: 1px solid #ddd;
          padding: 8px 12px;
          width: 100%;
          outline: none;
          font-size: 13px;
        }
        .chooser-list {
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-y: auto;
          flex-grow: 1;
        }
        .chooser-list-item {
          padding: 8px 12px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
          color: #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .chooser-list-item:hover {
          background: #f0f8ff;
        }
        .action-btns button {
          background: #f9f9f9;
          border: 1px solid #ccc;
          color: #555;
          cursor: pointer;
          border-radius: 3px;
          margin-left: 4px;
          padding: 2px 6px;
        }
        .action-btns button:hover {
          background: #e0e0e0;
        }
        .custom-chooser-footer {
          padding: 12px 16px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #d0d0d0;
          background: #e8e8e8;
        }
        .btn-cancel {
          background: #e0e0e0;
          border: 1px solid #aaa;
          color: #333;
          padding: 6px 16px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: bold;
        }
        .btn-apply {
          background: #5c6e3b; 
          border: 1px solid #4a5a2e;
          color: #fff;
          padding: 6px 16px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: bold;
        }
        .btn-apply:hover {
          background: #4a5a2e;
        }
      `}</style>

      <div className="custom-chooser-overlay">
        <div className="custom-chooser-modal">
          
          <div className="custom-chooser-header">
            <strong>Custom column set</strong>
          </div>

          <div className="custom-chooser-body">
            {/* Left Panel: Available Columns */}
            <div className="chooser-column">
              <div className="chooser-col-header">
                <span>Available columns</span>
                <button onClick={moveAllToVisible} className="chooser-link-btn">Add all</button>
              </div>
              <div className="chooser-list-container">
                <input
                  type="text"
                  placeholder="Find..."
                  className="chooser-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ul className="chooser-list">
                  {filteredAvailableCols.map((col) => (
                    <li key={col.colId} className="chooser-list-item" onClick={() => moveToVisible(col)}>
                      {col.headerName}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Panel: Visible Columns */}
            <div className="chooser-column">
              <div className="chooser-col-header">
                <span>Visible columns</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={loadCurrentGridState} className="chooser-link-btn">Reset</button>
                  <button onClick={moveAllToAvailable} className="chooser-link-btn">Clear all</button>
                </div>
              </div>
              <div className="chooser-list-container">
                <ul className="chooser-list">
                  {visibleCols.map((col, index) => (
                    <li key={col.colId} className="chooser-list-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                           type="checkbox" 
                           checked={true} 
                           onChange={() => moveToAvailable(col)} 
                           style={{ cursor: 'pointer' }}
                        />
                        <span>{col.headerName}</span>
                      </div>
                      <div className="action-btns">
                        <button onClick={(e) => { e.stopPropagation(); moveUp(index); }} disabled={index === 0}>↑</button>
                        <button onClick={(e) => { e.stopPropagation(); moveDown(index); }} disabled={index === visibleCols.length - 1}>↓</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="custom-chooser-footer">
            <button onClick={onClose} className="btn-cancel">Cancel</button>
            <button onClick={handleApply} className="btn-apply">Apply</button>
          </div>

        </div>
      </div>
    </>
  );
};
