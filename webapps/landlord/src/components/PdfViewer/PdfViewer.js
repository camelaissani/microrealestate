import { Drawer, DrawerContent, DrawerHeader } from '../ui/drawer';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';

import { apiFetcher } from '../../utils/fetch';
import { Button } from '@material-ui/core';
import EditorButton from '../RichTextEditor/EditorButton';
import Loading from '../Loading';
import { printPlugin } from '@react-pdf-viewer/print';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

export default function PdfViewer({ open, setOpen, pdfDoc }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [pdfSrc, setPdfSrc] = useState();

  const printPluginInstance = printPlugin();
  const { Print } = printPluginInstance;

  const handleClose = useCallback(() => {
    setPdfSrc();
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    (async () => {
      if (pdfDoc?.url) {
        try {
          const response = await apiFetcher().get(pdfDoc.url, {
            responseType: 'blob'
          });
          setPdfSrc(URL.createObjectURL(response.data));
        } catch (error) {
          handleClose();
          console.error(error);
          toast.error(t('Document not found'));
        }
      }
    })();
  }, [t, pdfDoc, store, handleClose]);

  if (open && pdfSrc) {
    return (
      <Drawer open={open} onOpenChange={setOpen} dismissible={false}>
        <DrawerContent className="w-full h-full p-4">
          <DrawerHeader className="flex items-center px-0">
            <div className="text-base md:text-xl font-semibold">
              {pdfDoc.title}
            </div>
            <div className="flex flex-grow justify-end gap-4">
              <Print>
                {(props) => (
                  <EditorButton
                    iconType="ri-printer-fill"
                    onClick={props.onClick}
                  />
                )}
              </Print>
              <Button variant="contained" size="small" onClick={handleClose}>
                {t('Close')}
              </Button>
            </div>
          </DrawerHeader>
          <div className="overflow-auto">
            <div className="max-w-4xl md:mx-auto">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.14.305/legacy/build/pdf.worker.js">
                <Viewer fileUrl={pdfSrc} plugins={[printPluginInstance]} />
              </Worker>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (open && !pdfSrc) {
    return <Loading />;
  }

  return null;
}
