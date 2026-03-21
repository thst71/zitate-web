import { useState } from 'react';
import { exportService, ImportOptions, ImportResult } from '../services/export.service';

export interface ExportImportState {
  isExporting: boolean;
  isImporting: boolean;
  progress: number;
  error: string | null;
}

export const useExportImport = () => {
  const [state, setState] = useState<ExportImportState>({
    isExporting: false,
    isImporting: false,
    progress: 0,
    error: null
  });

  const exportData = async () => {
    setState(prev => ({ ...prev, isExporting: true, error: null, progress: 0 }));
    
    try {
      setState(prev => ({ ...prev, progress: 25 }));
      
      const blob = await exportService.exportAllData();
      
      setState(prev => ({ ...prev, progress: 75 }));
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `zitate-backup-${timestamp}.json`;
      
      exportService.downloadFile(blob, filename);
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      // Reset after short delay
      setTimeout(() => {
        setState(prev => ({ ...prev, isExporting: false, progress: 0 }));
      }, 1000);
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isExporting: false, 
        progress: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      }));
    }
  };

  const importData = async (file: File, options: ImportOptions): Promise<ImportResult> => {
    setState(prev => ({ ...prev, isImporting: true, error: null, progress: 0 }));
    
    try {
      setState(prev => ({ ...prev, progress: 25 }));
      
      const result = await exportService.importData(file, options);
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      // Reset after short delay
      setTimeout(() => {
        setState(prev => ({ ...prev, isImporting: false, progress: 0 }));
      }, 1000);
      
      if (!result.success) {
        setState(prev => ({ ...prev, error: result.message }));
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setState(prev => ({ 
        ...prev, 
        isImporting: false, 
        progress: 0,
        error: errorMessage
      }));
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    exportData,
    importData,
    clearError
  };
};
