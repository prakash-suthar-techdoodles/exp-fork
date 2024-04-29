import type Queue from './QueueType';

// Function to create a new queue
function createQueue<T>(processItem: (item: T) => Promise<void>): Queue<T> {
    // Array to hold the elements of the queue
    const elements: T[] = [];
    let isProcessing = false;

    // Function to remove an item from the front of the queue
    function dequeue(): T | undefined {
        return elements.shift();
    }

    // Function to check if the queue is empty
    function isEmpty(): boolean {
        return elements.length === 0;
    }

    // Initiates the processing of items in the queue.
    // Continues to dequeue and process items as long as the queue is not empty.
    // Sets the `isProcessing` flag to true at the start and resets it to false once all items have been processed.
    function run(): Promise<void> {
        return new Promise((resolve) => {
            isProcessing = true;
            function processNext() {
                if (!isEmpty()) {
                    const nextItem = dequeue();
                    if (nextItem) {
                        processItem(nextItem).then(processNext);
                    }
                } else {
                    isProcessing = false;
                    resolve();
                }
            }
            processNext();
        });
    }
    // Adds an item to the queue and initiates processing if not already in progress
    function enqueue(item: T): void {
        elements.push(item);
        if (!isProcessing) {
            run();
        }
    }

    // Function to get the item at the front of the queue without removing it
    function peek(): T | undefined {
        return elements.length > 0 ? elements[0] : undefined;
    }

    // Function to get the number of items in the queue
    function size(): number {
        return elements.length;
    }

    // Return an object with the queue operations
    return {
        run,
        enqueue,
        dequeue,
        isEmpty,
        peek,
        size,
    };
}

export default createQueue;
