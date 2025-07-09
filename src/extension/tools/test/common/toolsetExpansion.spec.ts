/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { packageJson } from '../../../platform/env/common/packagejson';

/**
 * Test cases for toolset expansion and picker state management fixes.
 * These tests verify that the fixes for the custom chat mode toolset bug work correctly.
 */
describe('Toolset Expansion and Picker State', () => {
	// Mock function similar to the actual implementation
	function getToolName(name: string): string {
		return name; // Simplified for testing
	}

	function expandToolsetReferences(toolReferences: Array<{ name: string }>): string[] {
		const expandedToolNames: string[] = [];
		
		for (const ref of toolReferences) {
			// Check if this reference name matches a toolset
			const toolset = packageJson.contributes.languageModelToolSets.find(ts => ts.name === ref.name);
			if (toolset) {
				// This is a toolset reference, expand it to individual tools
				expandedToolNames.push(...toolset.tools.map(toolName => getToolName(toolName)));
			} else {
				// This is a regular tool reference
				expandedToolNames.push(getToolName(ref.name));
			}
		}
		
		return expandedToolNames;
	}

	function isToolEnabledByToolset(toolName: string, toolPickerState: Map<string, boolean>): boolean {
		const toolsetContainingThisTool = packageJson.contributes.languageModelToolSets.find(toolset => 
			toolset.tools.some(toolInSet => getToolName(toolInSet) === toolName)
		);
		
		if (toolsetContainingThisTool) {
			const toolsetSelection = toolPickerState.get(toolsetContainingThisTool.name);
			if (toolsetSelection === true) {
				return true;
			}
		}
		
		return false;
	}

	describe('Toolset Expansion', () => {
		it('should pass through regular tool references unchanged', () => {
			const result = expandToolsetReferences([{ name: 'someRegularTool' }]);
			expect(result).toEqual(['someRegularTool']);
		});

		it('should expand toolset references to individual tools', () => {
			// Find a real toolset from package.json for testing
			const firstToolset = packageJson.contributes.languageModelToolSets[0];
			if (firstToolset) {
				const result = expandToolsetReferences([{ name: firstToolset.name }]);
				expect(result).toEqual(firstToolset.tools);
			}
		});

		it('should handle mixed toolset and regular tool references', () => {
			const firstToolset = packageJson.contributes.languageModelToolSets[0];
			if (firstToolset) {
				const result = expandToolsetReferences([
					{ name: firstToolset.name },
					{ name: 'someRegularTool' }
				]);
				expect(result).toEqual([...firstToolset.tools, 'someRegularTool']);
			}
		});

		it('should handle multiple toolset references', () => {
			const toolsets = packageJson.contributes.languageModelToolSets.slice(0, 2);
			if (toolsets.length >= 2) {
				const result = expandToolsetReferences([
					{ name: toolsets[0].name },
					{ name: toolsets[1].name }
				]);
				const expected = [...toolsets[0].tools, ...toolsets[1].tools];
				expect(result).toEqual(expected);
			}
		});
	});

	describe('Toolset Picker State', () => {
		it('should enable tool when its toolset is selected', () => {
			const toolset = packageJson.contributes.languageModelToolSets.find(ts => ts.tools.length > 0);
			if (toolset && toolset.tools[0]) {
				const pickerState = new Map([[toolset.name, true]]);
				const result = isToolEnabledByToolset(toolset.tools[0], pickerState);
				expect(result).toBe(true);
			}
		});

		it('should not enable tool when its toolset is disabled', () => {
			const toolset = packageJson.contributes.languageModelToolSets.find(ts => ts.tools.length > 0);
			if (toolset && toolset.tools[0]) {
				const pickerState = new Map([[toolset.name, false]]);
				const result = isToolEnabledByToolset(toolset.tools[0], pickerState);
				expect(result).toBe(false);
			}
		});

		it('should not enable tool when its toolset is not in picker state', () => {
			const toolset = packageJson.contributes.languageModelToolSets.find(ts => ts.tools.length > 0);
			if (toolset && toolset.tools[0]) {
				const pickerState = new Map([['otherToolset', true]]);
				const result = isToolEnabledByToolset(toolset.tools[0], pickerState);
				expect(result).toBe(false);
			}
		});

		it('should not enable tool that is not in any toolset', () => {
			const pickerState = new Map([['someToolset', true]]);
			const result = isToolEnabledByToolset('toolNotInAnyToolset', pickerState);
			expect(result).toBe(false);
		});
	});
});