import { AvoInspector } from "./AvoInspector";
import { AvoInspectorEnv } from "./AvoInspectorEnv";

describe('Environments', () => {

  test('Prod', () => {  
    // When
    let inspector = new AvoInspector("apiKey", AvoInspectorEnv.Prod);
    
    // Then
    expect(inspector.environment).toBe(AvoInspectorEnv.Prod) 
  });

  test('Dev', () => {
    // When
    let inspector = new AvoInspector("apiKey", AvoInspectorEnv.Dev);
    
    // Then
    expect(inspector.environment).toBe(AvoInspectorEnv.Dev)
  });

  test('Staging', () => {
    // When
    let inspector = new AvoInspector("apiKey", AvoInspectorEnv.Staging);
    
    // Then
    expect(inspector.environment).toBe(AvoInspectorEnv.Staging)
  });

});