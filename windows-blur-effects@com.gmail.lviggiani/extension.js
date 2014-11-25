/**
 * windows-blur-effects@com.gmail.lviggiani
 * Apply effects to windows on blur
 * 
 * Copyright © 2014 Luca Viggiani, All rights reserved
 *
 * This is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.0 of the License, or (at your option) any later version.

 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details:
 * 
 * https://www.gnu.org/licenses/lgpl.html
 * 
 * AUTHOR: Luca Viggiani (lviggiani@gmail.com)
 * PROJECT SITE: https://github.com/lviggiani/gnome-shell-extension-wbe
 * 
 * CREDITS: credits also go to  Florian Mounier aka paradoxxxzero which I got
 * the inspiration and some code hinting from. You may find his original
 * project here:
 * 
 * https://github.com/paradoxxxzero/gnome-shell-focus-effects-extension
 *
 */

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const ExtensionUtils = imports.misc.extensionUtils;

const extension = ExtensionUtils.getCurrentExtension();
const display = global.display;

const privateExcludeList = ["Gnome-shell"]; // an array of wm-class to be excluded from filters not modifiable by user

const excludeList = []; // an array of wm-class to be excluded from filters

const filters = extension.imports.shared.filters;

var focusAppConnection, switchWorkspaceConnection, trackedWindowsChangedConnection;

var isExtensionEnabled = false;

function init(){}

function enable(){
	focusAppConnection = global.display.connect('notify::focus-window', updateApps);
	switchWorkspaceConnection = global.window_manager.connect('switch-workspace', updateApps);
	trackedWindowsChangedConnection = Shell.WindowTracker.get_default().connect('tracked-windows-changed', updateApps);
	
	
	isExtensionEnabled = true;
	updateApps();
}

function disable(){
    global.display.disconnect(focusAppConnection);
    global.window_manager.disconnect(switchWorkspaceConnection);
    Shell.WindowTracker.get_default().disconnect(trackedWindowsChangedConnection);
    
	isExtensionEnabled = false;
	updateApps();
}

function updateApps(){
	var runningApps = Shell.AppSystem.get_default().get_running();
	
	for (var co=0; co<runningApps.length; co++)
		updateWindows(runningApps[co]);
}

function updateWindows(app){
	var windows = app.get_windows();
	var activeActor = (display.focus_window)? display.focus_window.get_compositor_private() : null;
	var activeMonitor = (display.focus_window)? display.focus_window.get_monitor() : -1;
		
	for (var co=0; co<windows.length; co++){
		var window = windows[co];
		var actor = window.get_compositor_private();
		if (!actor) continue;
		
		// Fix for issue #4: ignore windows on other screens
		if (window.get_monitor()!=activeMonitor) continue;
		
		var flag = (actor!=activeActor) && isExtensionEnabled;
		
		// Fix issue #1: Exclude some windows from effects
		flag = flag && !excludeList.contains(window.wm_class);
		
		// Tentative fix for issue #5: prevent Desktop from being blurred
		flag = flag && !privateExcludeList.contains(window.wm_class);
		
		applyFilters(actor, flag);
	}
}

function applyFilters(actor, flag){
	for (var co=0; co<filters.length; co++){
		var filter = filters[co];
		flag = flag && filter.active;
		
		var ff = actor.get_effect(filter.name);
		if (flag){
			if (!ff)
				actor.add_effect_with_name(filter.name, (ff = new filter.effect()));
		} else {
			if (ff)
				actor.remove_effect_by_name(filter.name);
		}
		
		if (ff && (filter.methods!=undefined) && (filter.values!=undefined)
				&& (filter.methods.length == filter.values.length)){
			
			for (var i=0; i<filter.methods.length; i++)
				if (ff[filter.methods[i]]!=undefined)
					ff[filter.methods[i]](filter.values[i]);
		}
	}
}

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}
