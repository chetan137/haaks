      *****************************************************************
      * CUSTOMER RECORD COPYBOOK                                     *
      * DESCRIPTION: COBOL COPYBOOK FOR CUSTOMER DATA PROCESSING     *
      * AUTHOR: LEGACY SYSTEMS TEAM                                  *
      * DATE: 1995-03-15                                             *
      *****************************************************************

       01  CUSTOMER-RECORD.
           05  CUST-ID                PIC 9(8).
           05  CUST-NAME              PIC X(50).
           05  CUST-ADDRESS.
               10  CUST-STREET        PIC X(40).
               10  CUST-CITY          PIC X(25).
               10  CUST-STATE         PIC X(2).
               10  CUST-ZIP           PIC 9(5).
           05  CUST-PHONE             PIC 9(10).
           05  CUST-EMAIL             PIC X(60).
           05  CUST-BALANCE           PIC S9(7)V99 COMP-3.
           05  CUST-CREDIT-LIMIT      PIC S9(7)V99 COMP-3.
           05  CUST-STATUS            PIC X(1).
               88  CUST-ACTIVE        VALUE 'A'.
               88  CUST-INACTIVE      VALUE 'I'.
               88  CUST-SUSPENDED     VALUE 'S'.
           05  CUST-OPEN-DATE         PIC 9(8).
           05  CUST-LAST-ORDER-DATE   PIC 9(8).
           05  CUST-TYPE              PIC X(3).
               88  INDIVIDUAL         VALUE 'IND'.
               88  BUSINESS           VALUE 'BUS'.
               88  GOVERNMENT         VALUE 'GOV'.
           05  FILLER                 PIC X(10).

      *****************************************************************
      * ORDER RECORD COPYBOOK                                        *
      *****************************************************************

       01  ORDER-RECORD.
           05  ORDER-ID               PIC 9(10).
           05  ORDER-CUST-ID          PIC 9(8).
           05  ORDER-DATE             PIC 9(8).
           05  ORDER-SHIP-DATE        PIC 9(8).
           05  ORDER-STATUS           PIC X(2).
               88  ORDER-PENDING      VALUE 'PN'.
               88  ORDER-SHIPPED      VALUE 'SH'.
               88  ORDER-DELIVERED    VALUE 'DL'.
               88  ORDER-CANCELLED    VALUE 'CN'.
           05  ORDER-TOTAL            PIC S9(7)V99 COMP-3.
           05  ORDER-TAX              PIC S9(5)V99 COMP-3.
           05  ORDER-SHIPPING         PIC S9(5)V99 COMP-3.
           05  ORDER-ITEMS OCCURS 50 TIMES.
               10  ITEM-ID            PIC 9(8).
               10  ITEM-QTY           PIC 9(3).
               10  ITEM-PRICE         PIC S9(5)V99 COMP-3.
               10  ITEM-DISCOUNT      PIC S9(3)V99 COMP-3.
           05  FILLER                 PIC X(20).

      *****************************************************************
      * PRODUCT RECORD COPYBOOK                                      *
      *****************************************************************

       01  PRODUCT-RECORD.
           05  PROD-ID                PIC 9(8).
           05  PROD-NAME              PIC X(60).
           05  PROD-DESCRIPTION       PIC X(200).
           05  PROD-CATEGORY          PIC X(20).
           05  PROD-PRICE             PIC S9(5)V99 COMP-3.
           05  PROD-COST              PIC S9(5)V99 COMP-3.
           05  PROD-QTY-ON-HAND       PIC S9(6) COMP-3.
           05  PROD-REORDER-LEVEL     PIC S9(4) COMP-3.
           05  PROD-SUPPLIER-ID       PIC 9(6).
           05  PROD-STATUS            PIC X(1).
               88  PROD-ACTIVE        VALUE 'A'.
               88  PROD-DISCONTINUED  VALUE 'D'.
           05  PROD-CREATE-DATE       PIC 9(8).
           05  PROD-LAST-ORDER-DATE   PIC 9(8).
           05  FILLER                 PIC X(15).