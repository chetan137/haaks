import os
from faker import Faker

# Initialize Faker for generating realistic data
fake = Faker()

def create_large_dataset(record_count=500000):
    """
    Generates a large employee dataset with a corresponding COBOL copybook.
    """
    print(f"Starting generation of {record_count} records...")

    # 1. Define the COBOL Copybook (.cpy) Layout
    copybook_content = """      ******************************************************************
      * EMPLOYEES.cpy - Employee Master Record Layout
      * This is a large, realistic employee file.
      ******************************************************************
       01  EMPLOYEE-RECORD.
           05  EMP-ID             PIC 9(8).
           05  EMP-FIRST-NAME     PIC X(20).
           05  EMP-LAST-NAME      PIC X(20).
           05  EMP-EMAIL          PIC X(40).
           05  EMP-JOB-TITLE      PIC X(30).
           05  EMP-HIRE-DATE      PIC 9(8).
           05  EMP-SALARY         PIC S9(7)V99.
"""

    # Write the .cpy file
    with open("EMPLOYEES.cpy", "w") as f:
        f.write(copybook_content)
    print("EMPLOYEES.cpy file created successfully.")

    # 2. Generate the large Data File (.dat)
    with open("EMPLOYEES.dat", "w") as f:
        for i in range(1, record_count + 1):
            emp_id = str(i).zfill(8)
            first_name = fake.first_name().ljust(20)
            last_name = fake.last_name().ljust(20)
            email = fake.email().ljust(40)
            job = fake.job().ljust(30)
            hire_date = fake.date_between(start_date='-10y').strftime('%Y%m%d')
            salary = f"{fake.random_int(min=30000, max=150000)}{fake.random_int(min=0, max=99):02d}".zfill(9)

            record = f"{emp_id}{first_name}{last_name}{email}{job}{hire_date}{salary}\n"
            f.write(record)

            if i % 50000 == 0:
                print(f"... {i} records generated.")

    file_size = os.path.getsize("EMPLOYEES.dat")
    print("\nEMPLOYEES.dat file created successfully!")
    print(f"Total Records: {record_count}")
    print(f"Approximate File Size: {file_size / (1024*1024):.2f} MB")


if __name__ == "__main__":
    create_large_dataset()
