import { exec } from 'child_process';

//
// Systemd commands to consider
//
// list all installed service units - systemctl list-unit-files --type=service
// list all installed service units enabled and disabled - systemctl list-unit-files --type=service --state=enabled,disabled
// list all loaded services - systemctl list-units --type=service
// list all loaded running services - systemctl list-units --type=service --state=running

const SYSTEMD_LIST_RUNNING = `systemctl list-units --type=service --state=running,exited,failed --legend=false --no-pager ${process.env.SERVICES_JSON_OUTPUT === undefined
  ? " --plain | sed 's/ \\{1,\\}/,/g'"
  : ' --output json'
  }`;
const SYSTEMD_LIST_UNITS = `systemctl list-unit-files --type=service --state=enabled,disabled --legend=false --no-pager ${process.env.SERVICES_JSON_OUTPUT === undefined
  ? " --plain | sed 's/ \\{1,\\}/,/g'"
  : ' --output json'
  }`;

const SYSTEMD_RESTART_UNIT = `systemctl restart `;
const SYSTEMD_STOP_UNIT = `systemctl stop `;
const SYSTEMD_START_UNIT = `systemctl start `;

export interface SystemdListUnitsOuput {
  unit_file: string;
  state: string;
  vendor_state: string;
}

export interface SystemdUnitList {
  unit: string;
  state: string;
  active: string;
  sub: string;
  description: string;
}

let systemUnits: SystemdUnitList[] = [];

export function parseUnitList(
  existingUnits: SystemdUnitList[],
  units: string
): SystemdUnitList[] {
  const unitList: string[] = units.split('\n');

  const newUnitList = [...existingUnits];

  unitList.forEach((unit, index) => {
    unit = unit.trim();
    if (unit.length > 0 && unit.includes(',')) {
      // console.log(`Unit ${index}: `, unit)

      const unitFields = unit.split(',');
      if (unitFields.length > 2) {
        const newUnit: SystemdUnitList = {
          unit: unitFields[0],
          state: unitFields[1],
          active: 'inactive',
          sub: '',
          description: '',
        };
        const existingIndex = newUnitList.findIndex(
          (unit) => unit.unit === unitFields[0]
        );
        if (existingIndex < 0) {
          newUnitList.push(newUnit);
        } else {
          newUnitList[existingIndex].state = newUnit.state;
        }
      }
    }
  });

  return newUnitList;
}

export function parseRunningUnitList(
  existingUnits: SystemdUnitList[],
  units: string
): SystemdUnitList[] {
  const unitList: string[] = units.split('\n');

  const newUnitList = [...existingUnits];

  unitList.forEach((unit, index) => {
    unit = unit.trim();
    if (unit.length > 0 && unit.includes(',')) {
      // console.log(`Unit ${index}: `, unit)

      const unitFields = unit.split(',');
      if (unitFields.length > 3) {
        const description = unitFields.slice(4).join(' ');
        const newUnit: SystemdUnitList = {
          unit: unitFields[0],
          state: unitFields[1],
          active: unitFields[2],
          sub: unitFields[3],
          description: description,
        };
        const existingIndex = newUnitList.findIndex(
          (unit) => unit.unit === unitFields[0]
        );
        // console.log("New Unit: ", newUnit);
        // console.log("Existing unit index: ", existingIndex);
        if (existingIndex < 0) {
          newUnitList.push(newUnit);
        } else {
          newUnitList[existingIndex].state = newUnit.state;
        }
      } else {
        console.warn(`Failed to parse unit ${unit} because of missing field count`);
      }
    } else {
      console.warn(`Failed to parse unit ${index}: ${unit} because of missing comma separation`);
    }
  });

  return newUnitList;
}

export function buildSystemUnitList(): Promise<SystemdUnitList[]> {
  return new Promise<SystemdUnitList[]>((resolve, reject) => {
    // Fetching the current loaded unit
    exec(SYSTEMD_LIST_RUNNING, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return reject(stderr);
      }

      if (process.env.SERVICES_JSON_OUTPUT === undefined) {
        // Parse the data in comma separated fields into a structure
        const parsedUnitList = parseRunningUnitList([], stdout);
        systemUnits = [...parsedUnitList];
      } else {
        // Parse the data in JSON encoded string with fields: "unit", "load" ,"active", "sub", "description"
        const parsedUnitList = JSON.parse(stdout);
        if (parsedUnitList) {
          systemUnits = [...parsedUnitList];
        } else {
          return reject('Cannot parse systemd running services json output');
        }
      }

      // Fetching the current installed unit files
      exec(SYSTEMD_LIST_UNITS, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return reject(stderr);
        }

        if (process.env.SERVICES_JSON_OUTPUT === undefined) {
          // Parse the data in comma separated fields into a structure
          const parsedUnitList = parseUnitList(systemUnits, stdout);
          systemUnits = [...parsedUnitList];
          resolve(systemUnits);
        } else {
          // Parse the data in JSON encoded string with fields: "unit_file", "state" ,"vendor_state"
          // and only add those that don't exist already on the list
          const parsedUnitList = JSON.parse(stdout) as SystemdListUnitsOuput[];
          if (parsedUnitList) {
            parsedUnitList.forEach((unit) => {
              const existingUnit = systemUnits.findIndex(
                (u) => u.unit === unit.unit_file
              );
              if (existingUnit < 0) {
                systemUnits.push({
                  unit: unit.unit_file,
                  state: unit.state,
                  active: 'inactive',
                  sub: '',
                  description: '',
                });
              }
            });
            resolve(systemUnits);
          } else {
            reject('Cannot parse systemd unit list json output');
          }
        }
      });
    });
  });
}

export function restartSystemdUnit(unit: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Fetching the current loaded unit
    exec(SYSTEMD_RESTART_UNIT + unit, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return reject(stderr);
      }

      resolve(stdout);
    });
  });
}

export function stopSystemdUnit(unit: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Fetching the current loaded unit
    exec(SYSTEMD_STOP_UNIT + unit, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return reject(stderr);
      }

      resolve(stdout);
    });
  });
}

export function startSystemdUnit(unit: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Fetching the current loaded unit
    exec(SYSTEMD_START_UNIT + unit, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return reject(error.message);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return reject(stderr);
      }

      resolve(stdout);
    });
  });
}
