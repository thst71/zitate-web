import { useState, useRef } from 'react';
import { useExportImport } from '../../hooks/useExportImport';
import { ImportOptions } from '../../services/export.service';
import './DataManagement.css';

export const DataManagement = () => {
  const { exportData, importData, isExporting, isImporting, progress, error, clearError } = useExportImport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    strategy: 'merge',
    includeMedia: true
  });

  const handleExport = async () => {
    await exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setShowImportOptions(true);
    }
  };

  const handleImportConfirm = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const result = await importData(file, importOptions);
    
    if (result.success) {
      setShowImportOptions(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Show success message
      alert(result.message);
    } else {
      alert(`Import failed: ${result.message}`);
    }
  };

  const handleImportCancel = () => {
    setShowImportOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="data-management">
      <div className="data-management-section">
        <h3>Backup & Restore</h3>
        <p>Export your data for backup or import from a previous export.</p>
        
        <div className="data-management-actions">
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting}
            aria-label="Export all data as JSON backup file"
          >
            {isExporting ? (
              <>
                <span className="spinner"></span>
                Exporting... ({progress}%)
              </>
            ) : (
              <>
                📤 Export Data
              </>
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleImportClick}
            disabled={isImporting}
            aria-label="Import data from JSON backup file"
          >
            {isImporting ? (
              <>
                <span className="spinner"></span>
                Importing... ({progress}%)
              </>
            ) : (
              <>
                📥 Import Data
              </>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Select JSON backup file to import"
        />

        {error && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="error-dismiss" onClick={clearError} aria-label="Dismiss error">×</button>
          </div>
        )}
      </div>

      {showImportOptions && (
        <div className="modal-overlay" role="dialog" aria-labelledby="import-dialog-title">
          <div className="modal-content">
            <h3 id="import-dialog-title">Import Options</h3>
            
            <div className="import-options">
              <div className="option-group">
                <label className="option-label">Import Strategy:</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={importOptions.strategy === 'merge'}
                      onChange={(e) => setImportOptions(prev => ({ 
                        ...prev, 
                        strategy: e.target.value as 'merge' | 'replace' 
                      }))}
                    />
                    <span>Merge with existing data</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="strategy"
                      value="replace"
                      checked={importOptions.strategy === 'replace'}
                      onChange={(e) => setImportOptions(prev => ({ 
                        ...prev, 
                        strategy: e.target.value as 'merge' | 'replace' 
                      }))}
                    />
                    <span>Replace all existing data</span>
                  </label>
                </div>
              </div>

              <div className="option-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={importOptions.includeMedia}
                    onChange={(e) => setImportOptions(prev => ({ 
                      ...prev, 
                      includeMedia: e.target.checked 
                    }))}
                  />
                  <span>Include images and audio</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleImportConfirm}>
                Import
              </button>
              <button className="btn btn-secondary" onClick={handleImportCancel}>
                Cancel
              </button>
            </div>

            {importOptions.strategy === 'replace' && (
              <div className="warning-message">
                <span className="warning-icon">⚠️</span>
                <span>This will permanently delete all existing data!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
