[Github](https://github.com/devonreed/netlist)

## Quickstart

```bash
git clone https://github.com/devonreed/netlist.git
cd netlist-app
docker compose build
docker compose up
```

Visit http://localhost:8000/

Login is unauthenticated and takes a simple email address to begin using the application.

There are pre-written netlist files in the [samples](https://github.com/devonreed/netlist/tree/main/samples) folder. These may be helpful when testing the app.

JSON schema for netlists is a list of components (id, type, value, pins) and nets (id, nodes). See the [Netlist definition file](https://github.com/devonreed/netlist/blob/main/frontend/src/Netlist.tsx) for more details.

## Application Screenshots

Login Screen\
<img width="660" alt="image" src="https://github.com/user-attachments/assets/cc20c3e8-f47d-4329-897e-dff86c58a6d7" />\
\
User Home Screen\
<img width="700" alt="image" src="https://github.com/user-attachments/assets/e3a5973b-2c66-40c5-84a3-49c1815f4a9f" />\
\
Valid Netlist Screen\
<img width="714" alt="image" src="https://github.com/user-attachments/assets/dc40df71-8341-46bd-86b2-a91dd96f770e" />\
\
Invalid Netlist Screen\
<img width="886" alt="image" src="https://github.com/user-attachments/assets/3f1079e2-6d40-4d4d-91b8-9ac194d97f9c" />
