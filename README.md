# Nostr IoT DVM Simulator

A IoT simulator for Nostr written in TypeScript and using deno.

## Usage

1. Copy config.json.example to config.json and modify the values as needed.
2. Run the following command:

```bash
deno run --allow-net --allow-read src/main.ts
```

## Plugins

The simulator supports a plugin architecture.

### Creating a Plugin

To add a new plugin to the system, follow these steps:

1. **Plugin Directory Structure**: Each plugin should reside in its own
   directory inside the `plugins` folder. The directory should contain:
   - The plugin's main TypeScript file (e.g., `plugin.ts`).
   - An optional `config.json` file, if the plugin requires configuration
     parameters like units, thresholds, etc.

   Example:
   ```
   /plugins
      /myPlugin
         - myPlugin.ts
         - config.json
   ```

2. **Plugin Interface**: The plugin must implement a few basic methods to
   integrate smoothly with the system:
   - **`getCapabilities(): string[]`**: Returns a list of capabilities that the
     plugin provides.
   - **`execute(params: (string | number)[]): string`**: Executes the
     functionality of the plugin based on input parameters and returns a result
     (as a string).

### Step-by-Step Guide to Create a Plugin

#### Step 1: Define the Plugin Code

In the `plugins/myPlugin/` directory, create a TypeScript file for your plugin
(e.g., `myPlugin.ts`). Below is an example of what your plugin should look like.

```typescript
// plugins/myPlugin/myPlugin.ts

import { PluginConfig } from "../../types.ts"; // Adjust path if necessary

export default class MyPlugin {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  getCapabilities(): string[] {
    return ["myCustomCapability"];
  }

  execute(params: (string | number)[] = []): string {
    // Perform some action based on params and return a result
    return `MyPlugin executed with params: ${JSON.stringify(params)}`;
  }
}
```

#### Step 2: Add a Plugin Config (Optional)

If your plugin requires additional configuration (e.g., units, thresholds),
create a `config.json` file in the plugin directory. This file will be loaded
automatically by the system when the plugin is initialized.

Example `config.json`:

```json
{
  "unit": "exampleUnit",
  "threshold": 10
}
```

#### Step 3: Update the Main Configuration File

To tell the system to load your plugin, you need to update the main
configuration file (`config.json`) located in the root directory of the project.
Add a new entry for your plugin, specifying its name and path.

Example update to `config.json`:

```json
{
  "plugins": [
    { "name": "myPlugin", "path": "./plugins/myPlugin/myPlugin.ts" }
  ]
}
```

- **`name`**: The name of your plugin (used for identification purposes).
- **`path`**: The relative path to the main TypeScript file of your plugin.

#### Step 4: Define the Plugin's Capabilities

When the system loads your plugin, it will call the `getCapabilities()` method.
Define any capabilities that your plugin provides, which will be used to call
the correct functionality.

For example, if your plugin provides a motor control capability:

```typescript
getCapabilities(): string[] {
    return ["runMotor"];
}
```

You can then handle the logic in the `execute()` method for the `runMotor`
capability when invoked.

### Example Plugin Execution

Once the plugin is added and properly configured, it will be dynamically loaded
by the application based on the main configuration file. When the application
runs, it will:

- Detect the plugin's capabilities.
- Execute the plugin's functionality based on those capabilities.

For example, if your plugin has the `runMotor` capability, it can be invoked by
the main application like so:

```typescript
const motorParams = ["value", 20, "unit", "rpm"];
plugin.execute(motorParams);
```

### Notes:

- **Plugin Config (Optional)**: If your plugin does not require configuration,
  you can omit the `config.json` file, and the system will simply pass an empty
  object as the config to your plugin.
- **Flexible Parameters**: The `execute()` method accepts an array of parameters
  that can be strings or numbers. Customize the behavior of your plugin based on
  the input you receive.

### Troubleshooting

- Ensure the path in the main `config.json` file points correctly to the
  plugin's main TypeScript file.
- If your plugin requires configuration, ensure the `config.json` in the plugin
  directory contains valid JSON.

# Tests

Run the deno test suite with:

```bash
deno test --allow-write --allow-read
```
