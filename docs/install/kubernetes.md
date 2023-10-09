# Kubernetes

Since there is an official [docker](../docker/) image built for this repo, it is trivial to set up a kubernetes
deployment on your cluster.

## Yaml

Deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: route53-dyndns
  namespace: route53-dyndns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: route53-dyndns
  template:
    metadata:
      labels:
        app: route53-dyndns
    spec:
      containers:
        - name: route53-dyndns
          image: sjmayotte/route53-dynamic-dns
          env:
            - name: AWS_ACCESS_KEY_ID
              value: key_here
            - name: AWS_SECRET_ACCESS_KEY
              value: secret_here
            - name: AWS_REGION
              value: region_here # eg us-west-1
            - name: ROUTE53_HOSTED_ZONE_ID
              value: # comes from your route53 page, in the Zone ID column under hosted zones.
            - name: ROUTE53_DOMAIN
              value: my.static.domain
            - name: ROUTE53_TYPE
              value: A # you'll typically want A or AAA
            - name: ROUTE53_TTL
              value: "120" # default is 60
            - name: LOG_TO_STDOUT
              value: "true" # useful to set so that logs go to kubernetes
            - name: TZ
              value: America/Denver # pick your timezone here.
```

Namespace:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: route53-dyndns
```

You can also create your namespace with `kubectl create namespace route53-dyndns`

## Installation

Create the two files above, and change the settings to your values. Apply both of them with `kubectl apply -f .`

You can then get the logs of your pod with: `kubectl -n route53-dyndns logs deployments/route53-dyndns`
