       01  CUSTOMER-RECORD.
           05  CUST-ID            PIC X(10).
           05  CUST-NAME          PIC X(30).
           05  CUST-BALANCE       PIC S9(8)V99 COMP-3.
           05  CUST-STATUS        PIC X(1).
           05  CUST-ADDRESS.
               10  STREET-ADDR    PIC X(40).
               10  CITY           PIC X(20).
               10  STATE          PIC X(2).
               10  ZIP-CODE       PIC X(10).
           05  CUST-PHONE         PIC X(15).
           05  LAST-UPDATE-DATE   PIC X(8).