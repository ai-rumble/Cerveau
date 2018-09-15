import { MathUtils } from "./";

/** An array with at least 1 or more items */
export type ArrayWithOneOrMore<T, K = number> = (
    [T] |
    { 0: T }
) & [T, ...T[]] & T[];

/**
 * Removes a matching element from the array, if present.
 *
 * @param array - The array to attempt to remove an element from.
 * @param elements - The element(s) you want to try to remove from the array.
 * @returns The number of elements removed.
 */
export function removeElements<T>(array: T[], ...elements: T[]): number {
    let removed = 0;
    for (const element of elements) {
        const index = array.indexOf(element);

        if (index > -1) {
            array.splice(index, 1);
            removed += 1;
        }
    }

    return removed;
}

/**
 * Removes a matching element from the array, if present.
 *
 * @param element - the element to remove from arrays.
 * @param arrays - The array(s) you want to try to the element from.
 * @returns The number of arrays this element was removed from.
 */
export function removeElementFrom<T>(element: T, ...arrays: T[][]): number {
    let removed = 0;
    for (const array of arrays) {
        const index = array.indexOf(element);

        if (index > -1) {
            array.splice(index, 1);
            removed += 1;
        }
    }

    return removed;
}

/**
 * Gets an element in the array wrapping around (both ways), so -1 would be the
 * last element, and length would warp to 0.
 *
 * @param array - The array to use to get items from.
 * @param index - Index to get in this array, if it is out of bounds
 * (index < 0 or index >= this.length), we will "wrap" that index around to be
 * in range.
 * @returns Element at the index, wrapped around when out of range.
 */
export function getWrapAroundAt<T>(array: T[], index: number): T {
    return array[MathUtils.wrapAround(index, array.length)];
}

/**
 * Returns the next element in the array by some offset,, wrapping around if
 * it would walk off the array.
 *
 * @param array - The array to get something in wrapping around.
 * @param element - Element in the array to find the index of.
 * @param offset - From the element's position where to move, up or down and
 * will wrap around.
 * @returns Undefined if the element was not in this array, or the
 * element at the offset from the passed in element in the array, wrapping
 * around.
 */
export function getWrapAround<T>(array: T[], element: T, offset?: number): T | undefined {
    const index = array.indexOf(element);
    if (index < 0) {
        return;
    }

    return getWrapAroundAt(array, index + (offset || 0));
}

/**
 * Convenience function to get the next element in this array after some element
 * Wrapping around if it would walk off the array.
 *
 * @see getWrapAround
 * @param array - The array to get elements in.
 * @param element - The element in the array to get the next element after
 * @returns the next element in the array after the element, or wraps to the
 * beginning if that element is the last element.
 */
export function nextWrapAround<T>(array: T[], element: T): T | undefined {
    return getWrapAround(array, element, 1);
}

/**
 * Convenience function to get the previous element in this array after some
 * element, wrapping around if it would walk off the array.
 *
 * @see getWrapAround
 * @param array - The array to get elements in.
 * @param element - The element in the array to get the previous element before
 * @returns the previous element in the array after the element, or wraps to the
 * beginning if that element is the last element
 */
export function previousWrapAround<T>(array: T[], element: T): T | undefined {
    return getWrapAround(array, element, -1);
}

/**
 * Checks if an array is empty, and notifies TypeScript that it is if so.
 *
 * @param array - The array to check if is empty.
 * @returns True if empty, false otherwise.
 */
export function isEmpty<T>(array: T[]): array is [] {
    return array.length === 0;
}

/**
 * Checks if an array has at least 1 item.
 *
 * @param array - The array to check if it has at least 1 element.
 * @returns True if not empty, otherwise false when empty.
 */
export function arrayHasElements<T>(array: T[]): array is ArrayWithOneOrMore<T> {
    return array.length > 0;
}

/**
 * Shuffles this array randomly IN PLACE.
 *
 * @param array - The array to shuffle IN PLACE.
 * @param rng - A callback that is a random number generator,
 * must generate numbers [0, 1).
 * @returns This array.
 */
export function shuffle<T>(array: T[], rng: () => number): T[] {
    // from http://stackoverflow.com/a/6274381/944727
    for (
        let j, x, i = array.length; i;
        // tslint:disable-next-line ban-comma-operator
        j = Math.floor(rng() * i), x = array[--i], array[i] = array[j], array[j] = x
    ) { /* pass */ }

    return array;
}

/**
 * Creates a 2D array (array of arrays).
 *
 * @param width - The width of the [first] array.
 * @param height - The height of the [second] arrays in the first.
 * @param defaultValue - The default value to fill in each element
 * in all arrays with.
 * @returns A 2D array, all fill in with the default value.
 */
export function make2D<T>(width: number, height: number, defaultValue: T): T[][];

/**
 * Creates a 2D array (array of arrays).
 *
 * @param width - The width of the [first] array.
 * @param height - The height of the [second] arrays in the first.
 * @returns A 2D array, all fill in with undefined.
 */
export function make2D<T>(width: number, height: number): Array<Array<T | undefined>>;

/**
 * Creates a 2D array (array of arrays).
 *
 * @param width - The width of the [first] array.
 * @param height - The height of the [second] arrays in the first.
 * @param defaultValue - (optional) The default value to fill in each element
 * in all arrays with.
 * @returns A 2D array, all fill in with the default value if given, otherwise
 * filled in with undefined.
 */
export function make2D<T>(width: number, height: number, defaultValue?: T): Array<Array<T | undefined>> {
    const array: Array<Array<T | undefined>> = [];
    for (let x = 0; x < width; x++) {
        const subArray: Array<T | undefined> = [];
        subArray.length = height;
        subArray.fill(defaultValue);

        array.push(subArray);
    }

    return array;
}

/**
 * Filters an array IN PLACE, as opposed to returning a new array.
 *
 * @param array - The array to filter, it will be mutated.
 * @param filter - The filter function, return true on elements to keep.
 */
export function filterInPlace<T>(array: T[], filter: (element: T) => boolean): void {
    const filtered = array.filter(filter);
    array.length = filtered.length;
    for (let i = 0; i < filtered.length; i++) {
        array[i] = filtered[i];
    }
}

/**
 * Checks to make sure at least two arrays all contain the same elements. The
 * order of the elements is immaterial.
 *
 * @param array1 - The first array to check.
 * @param array2 - The second array to check.
 * @param arrays - Any additional arrays to check. Only 2 are required.
 * @returns True if all arrays contain the same elements, false otherwise.
 */
export function includesTheSameElements(
    array1: ReadonlyArray<unknown>,
    array2: ReadonlyArray<unknown>,
    ...arrays: Array<Array<unknown>>
): boolean {
     // for easier usage of all other array.
    arrays.push(array2 as Array<unknown>);

    // First let's make sure they are all the same length.
    // If they are not, they cannot all contain the same elements, so there is
    // no need to iterate through them.
    const expectedLength = array1.length;
    for (const array of arrays) {
        if (array.length !== expectedLength) {
            return false;
        }
    }

    // Convert to Sets for contant lookup times.

    // The first set, to get elements from.
    const set1 = new Set(array1);
    // The rest of the sets, to check to ensure all have the same elements as
    // the above set.
    const sets = [array2, ...arrays].map((a) => new Set(a));

    // If we got here all arrays are the same size. So now we ensure all
    // elements are the same.
    for (const element of set1) {
        for (const set of sets) {
            if (!set.has(element)) {
                return false;
            }
        }
    }

    // If we got here, every set has the same elements, so the arrays contain
    // the same elements (order was ignored).
    return true;
}

/**
 * Checks to ensure that a given array is a subset of another array.
 *
 * @param subarray - The subset to check if is in the array.
 * @param array - The array to check make sure contains the subset.
 * @returns True if the array contains the given subset, false otherwise.
 */
export function isSubArrayOf(
    subarray: ReadonlyArray<unknown>,
    array: ReadonlyArray<unknown>,
): boolean {
    return subarray.every((val) => array.includes(val));
}

/**
 * Gets the elements from an array that are not present in another array.
 *
 * @param array - The array to check for items from. The results can only
 * come from this array.
 * @param subarray - the array to check if the items from are in.
 * @returns A new array with a sub set of the array, of elements not found in
 * the subarray.
 */
export function getMinusArray<T>(
    array: ReadonlyArray<T>,
    subarray: ReadonlyArray<unknown>,
): T[] {
    return array.filter((val) => !subarray.includes(val));
}