"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const utils = require("./utils");
const bundle_1 = require("./bundle");
const fs = require("fs");
function registerCommand(paths, stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = {
            successful: [],
            errors: [],
            deployments: []
        };
        console.log(`Target stamp: ${stamp}`);
        console.log('Paths', paths);
        for (let _path of paths) {
            console.log(`Registering ${_path}, it may take a while...`);
            try {
                // _path is pointing to directory, bundle then register
                let bundlePath = undefined;
                if (!fs.existsSync(_path)) {
                    console.warn(`${_path} does not exist. Skipping.`);
                }
                else if (path.extname(_path) === '') {
                    console.info(`${_path} does exist.`);
                    bundlePath = yield bundle_1.bundleCommand([_path]);
                }
                else if (path.extname(_path) === '.zip') {
                    console.info(`${_path} is a zip file.`);
                    bundlePath = _path;
                }
                else {
                    console.warn(`${_path} is pointing to neither a directory nor zip. Skipping.`);
                }
                if (bundlePath) {
                    let result = yield utils.stampPost(bundlePath, stamp, 'register');
                    if (result && result.data) {
                        if (result.success) {
                            console.log(`${_path} registered`);
                        }
                        else {
                            console.log(`${_path} registration failed`);
                        }
                        if (result.data.successful) {
                            response.successful = response.successful.concat(result.data.successful);
                        }
                        if (result.data.errors && result.data.errors.length > 0) {
                            response.errors = response.errors.concat(result.data.errors);
                            for (let e of result.data.errors) {
                                let index = e.indexOf(":");
                                let mes = e.substring(index + 1);
                                console.log(`Error: ${mes}`);
                            }
                        }
                        if (result.data.deployments) {
                            if (result.data.deployments.successful) {
                                // response.successful = response.successful.concat(result.data.deployments.successful);
                                for (let dep of result.data.deployments.successful) {
                                    let depResult = {
                                        name: dep.deploymentURN,
                                        entrypoints: []
                                    };
                                    console.log(`New deployment URN: ${dep.deploymentURN}`);
                                    if (dep.portMapping) {
                                        for (let ep of dep.portMapping) {
                                            let entrypoint = {
                                                iid: ep.iid,
                                                role: ep.role,
                                                endpoint: ep.endpoint,
                                                port: ep.port
                                            };
                                            depResult.entrypoints.push(entrypoint);
                                            console.log(`New deployment entrypoint: ${ep.iid}-${ep.role}-${ep.endpoint}:${ep.port}`);
                                        }
                                    }
                                    else if (dep.topology && dep.topology.roles) {
                                        for (let role of Object.keys(dep.topology.roles)) {
                                            if (dep.topology.roles[role].entrypoint && dep.topology.roles[role].entrypoint.domain) {
                                                let epUrl = dep.topology.roles[role].entrypoint.domain;
                                                let entrypoint = {
                                                    role: role,
                                                    domain: epUrl
                                                };
                                                depResult.entrypoints.push(entrypoint);
                                                console.log(`New deployment entrypoint: ${role}: ${epUrl}`);
                                            }
                                        }
                                    }
                                    response.deployments.push(depResult);
                                }
                            }
                            if (result.data.deployments.errors && result.data.deployments.errors.length > 0) {
                                response.errors = response.errors.concat(result.data.deployments.errors);
                                for (let e of result.data.deployments.errors) {
                                    let index = e.indexOf(":");
                                    let mes = e.substring(index + 1);
                                    console.log(`Error: ${mes}`);
                                }
                            }
                        }
                    }
                }
            }
            catch (e) {
                // console.log("ERROR", e);
                return Promise.reject(e);
            }
        }
        // console.log("Response", response);
        return Promise.resolve(response);
    });
}
exports.registerCommand = registerCommand;
//# sourceMappingURL=register.js.map