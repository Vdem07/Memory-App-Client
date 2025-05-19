import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import './App.css';

const DocsViewer = () => {
  const viewer = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const docUrl = urlParams.get('docUrl');  // Получаем URL документа из параметра

  useEffect(() => {
    if (docUrl) {
      WebViewer({
        path: '/webviewer/lib',
        initialDoc: docUrl,  // Используем переданный URL документа
        licenseKey: 'demo:1738518016021:616c85bd03000000007b3ebf97ede765f531d7a50942ae6c02cc258712',  // Укажите ваш ключ лицензии
      }, viewer.current).then((instance) => {
        const { documentViewer } = instance.Core;

        // Устанавливаем масштаб в 100%
        instance.UI.setZoomLevel('100%');

        documentViewer.addEventListener('documentLoaded', () => {
        });
      });
    }
  }, [docUrl]);

  return (
    <div className="App">
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default DocsViewer;
