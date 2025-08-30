# Database Common Issues & Solutions

This document tracks recurring database issues and their solutions to prevent repeated debugging sessions.

## Time Field Type Mismatch

**Issue**: PostgreSQL `TIME` column type vs JavaScript `TEXT` parameter mismatch
**Frequency**: Recurring issue across multiple functions
**Symptoms**: `column "time" is of type time without time zone but expression is of type text`

### Root Cause
- Database schema has `time` column as `TIME` type
- JavaScript/TypeScript code passes time as `TEXT` string
- PostgreSQL functions receive text parameters but try to insert into TIME columns

### Solution Pattern
Always convert text time parameters to PostgreSQL TIME type in database functions:

```sql
-- WRONG: Direct text insertion
INSERT INTO table_name (time) VALUES (p_time_text);

-- CORRECT: Convert text to TIME type with error handling
DECLARE
  v_time_value time := NULL;
BEGIN
  -- Convert text time to TIME type if provided
  IF p_time IS NOT NULL AND p_time != '' THEN
    BEGIN
      v_time_value := p_time::time;
    EXCEPTION
      WHEN OTHERS THEN
        v_time_value := NULL;
        RAISE LOG 'Warning: Could not convert time value "%" to TIME type', p_time;
    END;
  END IF;
  
  -- Use converted value in INSERT
  INSERT INTO table_name (time) VALUES (v_time_value);
END;
```

### Affected Functions
- `create_match_invitation()` - Fixed in migration 20250830000003
- Any future functions that handle time fields should use this pattern

### Prevention
- **Database Schema**: Document that `time` columns are PostgreSQL `TIME` type
- **Function Development**: Always handle type conversion for time parameters
- **Testing**: Test functions with both valid time strings ("14:30") and edge cases (NULL, empty string, invalid format)

## Other Common Database Issues

### UUID Array Parameters
**Issue**: PostgreSQL functions with UUID array parameters
**Solution**: Always declare parameter as `uuid[]` and handle NULL arrays properly

```sql
-- Function signature
CREATE FUNCTION example_function(
  p_targeted_players uuid[] DEFAULT NULL
)

-- Usage in queries
WHERE (
  p_targeted_players IS NULL OR 
  column_id = ANY(p_targeted_players)
)
```

### RLS Policy Bypassing
**Issue**: Row Level Security blocking function operations
**Solution**: Use `SECURITY DEFINER` for functions that need elevated privileges

```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS type
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
LANGUAGE plpgsql
```

### Function Parameter Order
**Issue**: Supabase RPC calls failing due to parameter order mismatch
**Solution**: Always use named parameters in JavaScript when calling functions

```javascript
// WRONG: Positional parameters (order-dependent)
const { data } = await supabase.rpc('function_name', [param1, param2]);

// CORRECT: Named parameters (order-independent)
const { data } = await supabase.rpc('function_name', {
  p_param1: value1,
  p_param2: value2
});
```

## Development Guidelines

1. **Always handle type conversions** in PostgreSQL functions for common JavaScript types
2. **Use error handling** with TRY/CATCH blocks for type conversions
3. **Add logging** for debugging type conversion failures
4. **Test edge cases** including NULL, empty strings, and invalid formats
5. **Document type expectations** in function comments
6. **Use named parameters** in Supabase RPC calls

## Migration Pattern

When fixing database functions, follow this pattern:

1. Drop existing function to avoid signature conflicts
2. Recreate function with proper type handling
3. Add comprehensive error handling
4. Test with various input types
5. Update documentation

```sql
-- Migration template
DROP FUNCTION IF EXISTS function_name(old_signature);

CREATE OR REPLACE FUNCTION function_name(new_signature)
RETURNS return_type
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  -- Type conversion variables
  v_converted_value target_type := NULL;
BEGIN
  -- Type conversion with error handling
  IF input_param IS NOT NULL THEN
    BEGIN
      v_converted_value := input_param::target_type;
    EXCEPTION
      WHEN OTHERS THEN
        v_converted_value := NULL;
        RAISE LOG 'Warning: Type conversion failed for %', input_param;
    END;
  END IF;
  
  -- Rest of function logic
END;
$$;

GRANT EXECUTE ON FUNCTION function_name TO authenticated;
```

---

**Last Updated**: August 30, 2025
**Next Review**: When database issues arise or new patterns emerge