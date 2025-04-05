import { Button, Image, Text, Box, Group } from "@mantine/core";
import { CldUploadWidget } from 'next-cloudinary';
import { useState } from "react";

interface ImageUploadProps {
  initialImage?: string;
  onImageChange: (url: string) => void;
}

export default function ImageUpload({ initialImage, onImageChange }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(initialImage || "");

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    onImageChange(url);
  };

  return (
    <Box>
      <Text size="sm" mb={5}>
        Item Image
      </Text>
      
      {imageUrl ? (
        <Box mb={10}>
          <Image 
            src={imageUrl} 
            alt="Item image" 
            height={200} 
            radius="md"
            mb={10}
          />
          <Group>
            <Button 
              variant="outline" 
              color="red" 
              size="xs"
              onClick={() => {
                setImageUrl("");
                onImageChange("");
              }}
            >
              Remove Image
            </Button>
            <CldUploadWidget
              uploadPreset="invento_uploads" 
              onSuccess={(result: any) => {
                console.log(result);
                if (result.info && result.info.secure_url) {
                  handleImageUpload(result.info.secure_url);
                }
              }}
            >
              {({ open }) => (
                <Button variant="outline" size="xs" onClick={() => open()}>
                  Change Image
                </Button>
              )}
            </CldUploadWidget>
          </Group>
        </Box>
      ) : (
        <CldUploadWidget
          uploadPreset="LoopTalk"
          onSuccess={(result: any) => {
            if (result.info && result.info.secure_url) {
              handleImageUpload(result.info.secure_url);
            }
          }}
        >
          {({ open }) => (
            <Button variant="outline" fullWidth onClick={() => open()}>
              Upload Image
            </Button>
          )}
        </CldUploadWidget>
      )}
    </Box>
  );
}