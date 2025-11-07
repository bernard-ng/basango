Specifying packages in a monorepo
Declaring directories for packages
First, your package manager needs to describe the locations of your packages. We recommend starting with splitting your packages into apps/ for applications and services and packages/ for everything else, like libraries and tooling.

pnpm
yarn
npm
bun
./package.json

{
"workspaces": [
"apps/*",
"packages/*"
]
}
→
bun workspace documentation
Using this configuration, every directory with a package.json in the apps or packages directories will be considered a package.

Turborepo does not support nested packages like apps/** or packages/** due to ambiguous behavior among package managers in the JavaScript ecosystem. Using a structure that would put a package at apps/a and another at apps/a/b will result in an error.If you'd like to group packages by directory, you can do this using globs like packages/* and packages/group/* and not creating a packages/group/package.json file.
package.json in each package
In the directory of the package, there must be a package.json to make the package discoverable to your package manager and turbo. The requirements for the package.json of a package are below.

Root package.json
The root package.json is the base for your workspace. Below is a common example of what you would find in a root package.json:

pnpm
yarn
npm
bun
./package.json

{
"private": true,
"scripts": {
"build": "turbo run build",
"dev": "turbo run dev",
"lint": "turbo run lint"
},
"devDependencies": {
"turbo": "latest"
},
"packageManager": "bun@1.2.0",
"workspaces": ["apps/*", "packages/*"]
}
Root turbo.json
turbo.json is used to configure the behavior of turbo. To learn more about how to configure your tasks, visit the Configuring tasks page.

Package manager lockfile
A lockfile is key to reproducible behavior for both your package manager and turbo. Additionally, Turborepo uses the lockfile to understand the dependencies between your Internal Packages within your Workspace.

If you do not have a lockfile present when you run turbo, you may see unpredictable behavior.
Anatomy of a package
It's often best to start thinking about designing a package as its own unit within the Workspace. At a high-level, each package is almost like its own small "project", with its own package.json, tooling configuration, and source code. There are limits to this idea—but its a good mental model to start from.

Additionally, a package has specific entrypoints that other packages in your Workspace can use to access the package, specified by exports.

package.json for a package
name
The name field is used to identify the package. It should be unique within your workspace.

It's best practice to use a namespace prefix for your Internal Packages to avoid conflicts with other packages on the npm registry. For example, if your organization is named acme, you might name your packages @acme/package-name.We use @repo in our docs and examples because it is an unused, unclaimable namespace on the npm registry. You can choose to keep it or use your own prefix.
scripts
The scripts field is used to define scripts that can be run in the package's context. Turborepo will use the name of these scripts to identify what scripts to run (if any) in a package. We talk more about these scripts on the Running Tasks page.

exports
The exports field is used to specify the entrypoints for other packages that want to use the package. When you want to use code from one package in another package, you'll import from that entrypoint.

For example, if you had a @repo/math package, you might have the following exports field:

./packages/math/package.json

{
"exports": {
".": "./src/constants.ts",
"./add": "./src/add.ts",
"./subtract": "./src/subtract.ts"
}
}
Note that this example uses the Just-in-Time Package pattern for simplicity. It exports TypeScript directly, but you might choose to use the Compiled Package pattern instead.

The exports field in this example requires modern versions of Node.js and TypeScript.
This would allow you to import add and subtract functions from the @repo/math package like so:

./apps/my-app/src/index.ts

import { GRAVITATIONAL_CONSTANT, SPEED_OF_LIGHT } from '@repo/math';
import { add } from '@repo/math/add';
import { subtract } from '@repo/math/subtract';
Using exports this way provides three major benefits:

Avoiding barrel files: Barrel files are files that re-export other files in the same package, creating one entrypoint for the entire package. While they might appear convenient, they're difficult for compilers and bundlers to handle and can quickly lead to performance problems.
More powerful features: exports also has other powerful features compared to the main field like Conditional Exports. In general, we recommend using exports over main whenever possible as it is the more modern option.
IDE autocompletion: By specifying the entrypoints for your package using exports, you can ensure that your code editor can provide auto-completion for the package's exports.
imports (optional)
The imports field gives you a way to create subpaths to other modules within your package. You can think of these like "shortcuts" to write simpler import paths that are more resilient to refactors that move files. To learn how, visit the TypeScript page.

You may be more familiar with TypeScript's compilerOptions#paths option, which accomplishes a similar goal. As of TypeScript 5.4, TypeScript can infer subpaths from imports, making it a better option since you'll be working with Node.js conventions. For more information, visit our TypeScript guide.
Source code
Of course, you'll want some source code in your package. Packages commonly use an src directory to store their source code and compile to a dist directory (that should also be located within the package), although this is not a requirement.

Common pitfalls
If you're using TypeScript, you likely don't need a tsconfig.json in the root of your workspace. Packages should independently specify their own configurations, usually building off of a shared tsconfig.json from a separate package in the workspace. For more information, visit the TypeScript guide.
You want to avoid accessing files across package boundaries as much as possible. If you ever find yourself writing ../ to get from one package to another, you likely have an opportunity to re-think your approach by installing the package where it's needed and importing it into your code.