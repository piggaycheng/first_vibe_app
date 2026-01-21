import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
} from '@mui/material';
import { toBlob } from 'html-to-image';

interface SaveLayoutDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, thumbnail?: Blob) => void;
  title: string;
  defaultName?: string;
  captureSelector: string; // The CSS selector of the element to capture
}

export default function SaveLayoutDialog({
  open,
  onClose,
  onSave,
  title,
  defaultName = '',
  captureSelector,
}: SaveLayoutDialogProps) {
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setLoading(false);
    }
  }, [open, defaultName]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const element = document.querySelector(captureSelector) as HTMLElement;
      let thumbnail: Blob | undefined;

      if (element) {
        // 1. 徹底隱藏編輯 UI 與標亮效果
        // 找出所有被標亮的元件
        const highlightedElements = document.querySelectorAll('.highlighted');
        highlightedElements.forEach(el => el.classList.remove('highlighted'));

        const style = document.createElement('style');
        style.innerHTML = `
          .delete-widget-btn { 
            display: none !important; 
          }
          .grid-stack-root, .grid-stack-item-content .grid-stack {
            background: transparent !important;
            border-color: transparent !important;
          }
        `;
        document.head.appendChild(style);

        try {
          // 增加延遲確保樣式渲染完成
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // 2. 擷取圖片：回歸單純的擷取，不需過度位移
          thumbnail = await toBlob(element, {
            quality: 0.9,
            backgroundColor: '#ffffff',
            skipFonts: true,
            styleCache: {},
            cacheBust: true,
            // 只需要一點點 padding 避免內容太貼邊
            style: {
              padding: '4px', 
              margin: '0', // 強制歸零 margin
              boxSizing: 'border-box',
              width: '100%', // 確保寬度佔滿
              height: '100%'
            }
          }) || undefined;
        } finally {
          // 恢復標亮效果與移除暫時樣式
          document.head.removeChild(style);
          highlightedElements.forEach(el => el.classList.add('highlighted'));
        }
      }

      onSave(name, thumbnail);
      onClose();
    } catch (error) {
      console.error('Failed to capture thumbnail:', error);
      // Even if capture fails, we still want to save the layout
      onSave(name);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Layout Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Box sx={{ position: 'relative' }}>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!name.trim() || loading}
          >
            Save
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
