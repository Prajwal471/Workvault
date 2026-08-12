interface DialRuleProps {
  style?: React.CSSProperties;
}

/**
 * Thin repeating-tick "dial rule" divider in the walnut accent.
 */
export function DialRule({ style }: DialRuleProps) {
  return <div className="dial-rule" style={style} aria-hidden />;
}
