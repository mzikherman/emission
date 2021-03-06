/**
 * Test helper that takes a component and "snapshots" it, returning its
 * string and JSON representation. Useful for asserting tree contents.
 *
 *  @example
 *
 *  const { text }  = getTestSnapshot(<MyComponent title='Hi!' />)
 *  expect(text).toContain('Hi!')
 */
import "react-native"
import renderer from "react-test-renderer"

export function getTestWrapper(TestComponent) {
  try {
    const snapshot = renderer.create(TestComponent)
    const text = JSON.stringify(snapshot.toJSON())
    const json = snapshot.toTree()

    return {
      snapshot,
      text,
      json,
    }
  } catch (error) {
    console.warn(`utils/getTestWrapper | Error returning test wrapper`, error)
  }
}
