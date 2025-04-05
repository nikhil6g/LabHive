import { CldUploadWidget } from 'next-cloudinary';

export const CloudinaryUploadWidget = ({ onUpload, children }) => {
  return (
    <CldUploadWidget
      uploadPreset="invento_uploads" // Create this preset in your Cloudinary dashboard
      onSuccess={(result) => {
        if (result.info && result.info.secure_url) {
          onUpload(result.info.secure_url);
        }
      }}
    >
      {({ open }) => {
        function handleOnClick(e) {
          e.preventDefault();
          open();
        }
        return (
          <div onClick={handleOnClick}>
            {children}
          </div>
        );
      }}
    </CldUploadWidget>
  );
};