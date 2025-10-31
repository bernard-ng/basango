import { describe, expect, it } from "vitest";

import {
	PipelineConfigSchema,
	createDateRange,
	formatDateRange,
	isTimestampInRange,
	PageRangeSpecSchema,
	PageRangeSchema,
	schemaToJSON,
} from "./schema";

describe("schema helpers", () => {
	it("creates date range from spec", () => {
		const range = createDateRange("2024-01-01:2024-01-31");
		expect(range.start).toBeLessThan(range.end);
		expect(formatDateRange(range)).toBe("2024-01-01:2024-01-31");
	});

	it("checks membership", () => {
		const range = createDateRange("2024-01-01:2024-01-02");
		expect(isTimestampInRange(range, range.start)).toBe(true);
		expect(isTimestampInRange(range, range.start - 1)).toBe(false);
	});

	it("parses page range spec", () => {
		const range = PageRangeSchema.parse(PageRangeSpecSchema.parse("1:10"));
		expect(range).toEqual({ start: 1, end: 10 });
	});

	it("produces json schema", () => {
		const json = schemaToJSON(PipelineConfigSchema);
		expect(json.type).toBe("object");
	});
});
