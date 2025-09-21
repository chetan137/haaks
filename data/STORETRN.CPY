******************************************************************
      * STORETRN.cpy - Retail Store Transaction Layout
      ******************************************************************
       01  TRANSACTION-RECORD.
           05  TRN-ID             PIC X(10).
           05  STORE-ID           PIC 9(4).
           05  REGISTER-ID        PIC 9(2).
           05  TRN-DATE           PIC X(8).
           05  TRN-TIME           PIC X(6).
           05  ITEM-COUNT         PIC 9(3).
           05  TOTAL-AMOUNT       PIC S9(5)V99.
           05  PAYMENT-TYPE       PIC X(4).
