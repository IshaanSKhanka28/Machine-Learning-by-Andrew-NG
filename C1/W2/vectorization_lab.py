import numpy as np
import time

def run_lab_code():
    print("--- 1. Vector Creation Examples ---")
    # NumPy routines which allocate memory and fill arrays with value
    a = np.zeros(4);                print(f"np.zeros(4) :   a = {a}, a shape = {a.shape}, a data type = {a.dtype}")
    a = np.zeros((4,));             print(f"np.zeros(4,) :  a = {a}, a shape = {a.shape}, a data type = {a.dtype}")
    a = np.random.random_sample(4); print(f"np.random.random_sample(4): a = {a}, a shape = {a.shape}, a data type = {a.dtype}")

    # NumPy routines which allocate memory and fill arrays with value but do not accept shape as input argument
    a = np.arange(4.);              print(f"np.arange(4.):     a = {a}, a shape = {a.shape}, a data type = {a.dtype}")
    a = np.random.rand(4);          print(f"np.random.rand(4): a = {a}, a shape = {a.shape}, a data type = {a.dtype}")

    # NumPy routines which allocate memory and fill with user specified values
    a = np.array([5,4,3,2]);  print(f"np.array([5,4,3,2]):  a = {a},     a shape = {a.shape}, a data type = {a.dtype}")
    a = np.array([5.,4,3,2]); print(f"np.array([5.,4,3,2]): a = {a}, a shape = {a.shape}, a data type = {a.dtype}")
    print()

    print("--- 2. Vector Indexing Operations ---")
    a = np.arange(10)
    print(f"a = {a}")
    # access an element
    print(f"a[2].shape: {a[2].shape} a[2]  = {a[2]}, Accessing an element returns a scalar")
    # access the last element, negative indexes count from the end
    print(f"a[-1] = {a[-1]}")
    # indexes must be within the range of the vector or they will produce an error
    try:
        c = a[10]
    except Exception as e:
        print("The error message you'll see when accessing out of range index a[10] is:")
        print(f"Error: {e}")
    print()

    print("--- 3. Vector Slicing Operations ---")
    a = np.arange(10)
    print(f"a         = {a}")
    # access 5 consecutive elements (start:stop:step)
    c = a[2:7:1];     print("a[2:7:1] = ", c)
    # access 3 elements separated by two 
    c = a[2:7:2];     print("a[2:7:2] = ", c)
    # access all elements index 3 and above
    c = a[3:];        print("a[3:]    = ", c)
    # access all elements below index 3
    c = a[:3];        print("a[:3]    = ", c)
    # access all elements
    c = a[:];         print("a[:]     = ", c)
    print()

    print("--- 4. Single Vector Operations ---")
    a = np.array([1,2,3,4])
    print(f"a             : {a}")
    # negate elements of a
    b = -a 
    print(f"b = -a        : {b}")
    # sum all elements of a, returns a scalar
    b = np.sum(a) 
    print(f"b = np.sum(a) : {b}")
    b = np.mean(a)
    print(f"b = np.mean(a): {b}")
    b = a**2
    print(f"b = a**2      : {b}")
    print()

    print("--- 5. Vector-Vector Element-wise Operations ---")
    a = np.array([ 1, 2, 3, 4])
    b = np.array([-1,-2, 3, 4])
    print(f"Binary operators work element wise: {a + b}")
    # try a mismatched vector operation
    c = np.array([1, 2])
    try:
        d = a + c
    except Exception as e:
        print("The error message you'll see for mismatched vector operation is:")
        print(f"Error: {e}")
    print()

    print("--- 6. Scalar-Vector Operations ---")
    a = np.array([1, 2, 3, 4])
    b = 5 * a 
    print(f"b = 5 * a : {b}")
    print()

    print("--- 7. Vector-Vector Dot Product ---")
    # Custom dot product using for loop
    def my_dot(a, b): 
        x=0
        for i in range(a.shape[0]):
            x = x + a[i] * b[i]
        return x

    # Test 1-D custom dot
    a = np.array([1, 2, 3, 4])
    b = np.array([-1, 4, 3, 2])
    print(f"my_dot(a, b) = {my_dot(a, b)}")

    # Test np.dot
    c = np.dot(a, b)
    print(f"NumPy 1-D np.dot(a, b) = {c}, np.dot(a, b).shape = {c.shape} ") 
    c = np.dot(b, a)
    print(f"NumPy 1-D np.dot(b, a) = {c}, np.dot(a, b).shape = {c.shape} ")
    print()

    print("--- 8. The Need for Speed: Vector vs For Loop ---")
    np.random.seed(1)
    a_large = np.random.rand(1000000)  # reduced slightly from 10,000,000 for faster demonstration run
    b_large = np.random.rand(1000000)

    tic = time.time()  # capture start time
    c_vec = np.dot(a_large, b_large)
    toc = time.time()  # capture end time
    print(f"np.dot(a, b) =  {c_vec:.4f}")
    print(f"Vectorized version duration: {1000*(toc-tic):.4f} ms ")

    tic = time.time()  # capture start time
    c_loop = my_dot(a_large, b_large)
    toc = time.time()  # capture end time
    print(f"my_dot(a, b) =  {c_loop:.4f}")
    print(f"loop version duration: {1000*(toc-tic):.4f} ms ")

    del(a_large); del(b_large)
    print()

    print("--- 9. Course 1 Example ---")
    X = np.array([[1],[2],[3],[4]])
    w = np.array([2])
    c = np.dot(X[1], w)
    print(f"X[1] has shape {X[1].shape}")
    print(f"w has shape {w.shape}")
    print(f"c has shape {c.shape}, c = {c}")
    print()

    print("--- 10. Matrix Creation ---")
    a = np.zeros((1, 5))                                       
    print(f"a shape = {a.shape}, a = {a}")                     
    a = np.zeros((2, 1))                                                                   
    print(f"a shape = {a.shape}, a = {a}") 
    a = np.random.random_sample((1, 1))  
    print(f"a shape = {a.shape}, a = {a}") 

    # NumPy routines which allocate memory and fill with user specified values
    a = np.array([[5], [4], [3]]);   print(f" a shape = {a.shape}, np.array: a = {a}")
    a = np.array([[5],
                  [4],
                  [3]]);
    print(f" a shape = {a.shape}, np.array: a = {a}")
    print()

    print("--- 11. Matrix Indexing ---")
    a = np.arange(6).reshape(-1, 2)
    print(f"a.shape: {a.shape}, \na= \n{a}")
    # access an element
    print(f"a[2,0].shape:   {a[2, 0].shape}, a[2,0] = {a[2, 0]}, type(a[2,0]) = {type(a[2, 0])}")
    # access a row
    print(f"a[2].shape:   {a[2].shape}, a[2]   = {a[2]}, type(a[2])   = {type(a[2])}")
    print()

    print("--- 12. Matrix Slicing ---")
    a = np.arange(20).reshape(-1, 10)
    print(f"a = \n{a}")
    print("a[0, 2:7:1] = ", a[0, 2:7:1], ",  a[0, 2:7:1].shape =", a[0, 2:7:1].shape)
    print("a[:, 2:7:1] = \n", a[:, 2:7:1], ",  a[:, 2:7:1].shape =", a[:, 2:7:1].shape)
    print("a[:,:] = \n", a[:,:], ",  a[:,:].shape =", a[:,:].shape)
    print("a[1,:] = ", a[1,:], ",  a[1,:].shape =", a[1,:].shape)
    print("a[1]   = ", a[1],   ",  a[1].shape   =", a[1].shape)

if __name__ == "__main__":
    run_lab_code()
