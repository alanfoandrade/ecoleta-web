import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import './styles.css';
import { FiUpload } from 'react-icons/fi';

interface IDropzoneProps {
  onFileUploaded(file: File): void;
}

const Dropzone: React.FC<IDropzoneProps> = ({ onFileUploaded }) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState('');

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const fileUrl = URL.createObjectURL(file);

      setSelectedFileUrl(fileUrl);
      onFileUploaded(file);
    },
    [onFileUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
  });

  return (
    <div className="dropzone" {...getRootProps()}>
      <input {...getInputProps()} accept="image/*" />

      {selectedFileUrl ? (
        <img src={selectedFileUrl} alt="thumbnail" />
      ) : (
        (isDragActive && <p>Solte o arquivo aqui ...</p>) || (
          <p>
            <FiUpload />
            Arraste algum arquivo para cá ou clique para selecionar um arquivo.
          </p>
        )
      )}
    </div>
  );
};

export default Dropzone;
