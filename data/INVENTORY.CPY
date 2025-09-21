******************************************************************
      * INVENTORY.cpy - Product Inventory Record Layout
      ******************************************************************
       01  INVENTORY-RECORD.
           05  INV-SKU            PIC X(12).
           05  INV-PRODUCT-NAME   PIC X(40).
           05  INV-CATEGORY       PIC X(20).
           05  INV-STOCK-QTY      PIC 9(5).
           05  INV-UNIT-PRICE     PIC 9(5)V99.
           05  INV-SUPPLIER-ID    PIC X(10).
