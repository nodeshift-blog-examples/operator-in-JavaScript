An Example OpenShift Operator written in TypeScript.

# Getting Started

To get started, start by creating all the OpenShift resources:

```bash
oc apply -k resources
```

This will create the `ts-operator` namespace and populate it with ImageStreams, a BuildConfig and a Deployment running the operator.

It will also create the `Memcached` Custom Resource Definition and the `memcached-editor` Role.

Move to the `ts-operator` project:

```bash
oc project ts-operator
```

Tail the logs of the operator by running:

```bash
oc logs -f deployment ts-operator
```

In a different terminal, create an instance of the CRD by running:

```bash
oc create -f resources/memcached-sample.yaml
```

You will see a new Deployment called `memcached-sample` with pods starting.

Now modify the size property in your Custom Resource:

```bash
oc edit memcached memcached-sample
```

Replace the size value from 2 to 4, then save. You will see the size of your deployment go from 2 to 4 and new pods starting.
