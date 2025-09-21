******************************************************************
      * CLAIMS.cpy - Healthcare Claim Transaction Layout
      ******************************************************************
       01  CLAIM-RECORD.
           05  CLAIM-ID           PIC X(15).
           05  PATIENT-ID         PIC 9(10).
           05  PROVIDER-ID        PIC X(12).
           05  SERVICE-DATE       PIC 9(8).
           05  DIAGNOSIS-CODE     PIC X(10).
           05  PROCEDURE-CODE     PIC X(10).
           05  AMOUNT-BILLED      PIC S9(7)V99.
           05  AMOUNT-PAID        PIC S9(7)V99.
           05  STATUS-CODE        PIC X(1).
