import os
import sys

sys.stdout.write('START\n')
sys.stdout.flush()

from dotenv import load_dotenv
sys.stdout.write('DOTENV loaded\n')
sys.stdout.flush()
load_dotenv()

import sqlalchemy
sys.stdout.write('SQLALCHEMY loaded\n')
sys.stdout.flush()

from database import engine, Base
from sqlalchemy import text
sys.stdout.write('ENGINE imported\n')
sys.stdout.flush()

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).fetchone()
        print('SUCCESS! Connection works. Result:', result)
        
        print('Creating tables...')
        Base.metadata.create_all(bind=engine)
        print('Tables created SUCCESS!')
except Exception as e:
    import traceback
    print("FAILED TO CONNECT:")
    traceback.print_exc()
