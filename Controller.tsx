
import React, { useState } from 'react';
import { Button } from '@ubs.websdk/react-core';
import { CustomColumnChooser } from './CustomColumnChooser'; 

export const ColumnChooserController = ({ gridApi }: { gridApi: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="gridheader colchooserbutton ml-2"
        icon="settings-14"
        size="optional"
        onClick={() => setIsOpen(true)}
        title="Column settings"
      />
      <CustomColumnChooser
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        gridApi={gridApi}
      />
    </>
  );
};
