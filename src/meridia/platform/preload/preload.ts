/* eslint-disable @typescript-eslint/no-unused-vars */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) MNovus. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { contextBridge } from "electron";
import { renderer } from "./global";

import "./listener";

contextBridge.exposeInMainWorld("electron", renderer);

export type ERenderer = typeof renderer;
