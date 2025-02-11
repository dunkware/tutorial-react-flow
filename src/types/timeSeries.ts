// types.ts

// Time Units and Range Types
export type TimeUnit = 'second' | 'minute' | 'hour' | 'day';

export interface RelativeTimePoint {
  value: number;
  unit: TimeUnit;
}

export interface RelativeTimeRange {
  start: RelativeTimePoint;
  end: RelativeTimePoint;
}

// Aggregation Types
export type DailyAggregationType = 'high' | 'low';
export type CurrentDayAggregationType = 'average' | 'range' | 'variance' | 'high' | 'low';

export interface AggregationConfig {
  type: 'daily' | 'currentDay';
  aggregations: DailyAggregationType[] | CurrentDayAggregationType[];
}

// Field Types and Definitions
export interface BaseField {
  name: string;
  description?: string;
}

export interface StaticField extends BaseField {
  type: 'static';
  value: any;
}

export interface TemporalField extends BaseField {
  type: 'temporal';
  temporalType: 'stream' | 'derived';
}

export interface StreamField extends TemporalField {
  temporalType: 'stream';
  streamSource: string;
  dataType: 'number' | 'string' | 'boolean';
}

// Types of temporal expressions
export interface MovingAverageExpression {
  type: 'movingAverage';
  sourceField: string;
  window: RelativeTimePoint;
}

export interface DeltaExpression {
  type: 'delta';
  sourceField: string;
  range: RelativeTimeRange;
}

export type TemporalExpression = MovingAverageExpression | DeltaExpression;

export interface DerivedField extends TemporalField {
  temporalType: 'derived';
  expression: TemporalExpression;
}

export type Field = StaticField | StreamField | DerivedField;

// Abstract Value Types
export type AbstractValueType = 
  | 'dailyAggregation'
  | 'currentDayAggregation'
  | 'relativeTimeValue'
  | 'currentValue';

export interface AbstractValueBase {
  fieldName: string;
  type: AbstractValueType;
}

export interface RelativeTimeValue extends AbstractValueBase {
  type: 'relativeTimeValue';
  timePoint: RelativeTimePoint;
}

export interface CurrentValue extends AbstractValueBase {
  type: 'currentValue';
}

export interface DailyAggregationValue extends AbstractValueBase {
  type: 'dailyAggregation';
  timeRange: RelativeTimeRange;
  aggregationType: DailyAggregationType;
}

export interface CurrentDayAggregationValue extends AbstractValueBase {
  type: 'currentDayAggregation';
  aggregationType: CurrentDayAggregationType;
}

export type FieldAbstractValue = 
  | RelativeTimeValue 
  | CurrentValue 
  | DailyAggregationValue 
  | CurrentDayAggregationValue;

// Expression Types
export type ExpressionType = 
  | 'rateOfChange'
  | 'difference'
  | 'ratio'
  | 'sum'
  | 'product'
  | 'max'
  | 'min';

export interface AbstractValueExpression {
  type: ExpressionType;
  leftOperand: FieldAbstractValue;
  rightOperand: FieldAbstractValue;
}

// Signal Criteria Types
export interface BaseCriterion {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
}

export interface SimpleCriterion extends BaseCriterion {
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: number | string | boolean;
}

export interface RangeCriterion extends BaseCriterion {
  operator: 'between';
  range: {
    min: number;
    max: number;
  };
}

export interface AbstractValueCriterion extends BaseCriterion {
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  compareWith: FieldAbstractValue | number;
}

export interface AbstractValueRangeCriterion extends BaseCriterion {
  operator: 'between';
  range: {
    min: FieldAbstractValue | number;
    max: FieldAbstractValue | number;
  };
}

export type Criterion = 
  | SimpleCriterion 
  | RangeCriterion 
  | AbstractValueCriterion 
  | AbstractValueRangeCriterion;

// Signal Definition
export interface Signal {
  name: string;
  description?: string;
  criteria: Array<{
    criterion: DirectSignalCriterion | ExpressionSignalCriterion;
    logicalOperator?: 'AND' | 'OR';
  }>;
}

export interface DirectSignalCriterion extends SignalCriterion {
  type: 'direct';
  value: FieldAbstractValue;
}

export interface ExpressionSignalCriterion extends SignalCriterion {
  type: 'expression';
  expression: AbstractValueExpression;
}

export interface SignalCriterion {
  type: 'direct' | 'expression';
  condition: {
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
    threshold: number;
  };
}

// Example usage and helpers
export const createRelativeTimeValue = (
  fieldName: string,
  value: number,
  unit: TimeUnit
): RelativeTimeValue => ({
  type: 'relativeTimeValue',
  fieldName,
  timePoint: { value, unit }
});

export const createDailyAggregationValue = (
  fieldName: string,
  startDays: number,
  endDays: number,
  aggregationType: DailyAggregationType
): DailyAggregationValue => ({
  type: 'dailyAggregation',
  fieldName,
  timeRange: {
    start: { value: startDays, unit: 'day' },
    end: { value: endDays, unit: 'day' }
  },
  aggregationType
});

// Helper to validate abstract value compatibility
export const validateAbstractValueComparison = (
  value1: FieldAbstractValue,
  value2: FieldAbstractValue
): boolean => {
  return value1.fieldName === value2.fieldName;
};