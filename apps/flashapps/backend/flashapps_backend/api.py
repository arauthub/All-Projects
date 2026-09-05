from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from wagtail.api.v2.views import PagesAPIViewSet, BaseAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.images.api.v2.views import ImagesAPIViewSet
from wagtail.documents.api.v2.views import DocumentsAPIViewSet
from home.models import (
    MaterialSnippet, Vehicle, Mechanic, InspectionBucket, 
    ServiceJob, Invoice, Attendance, BonusRule, Payroll,
    Shop, SeasonalOffer, InventoryPart, StockTransaction,
    BiometricLog, SalaryStructure
)
from home.community_models import CommunityPost, CommunityComment

class MaterialSnippetAPIViewSet(BaseAPIViewSet):
    model = MaterialSnippet

class BaseWritableAPIViewSet(viewsets.ModelViewSet, BaseAPIViewSet):
    """Custom ViewSet to allow POST/PATCH while keeping Wagtail integration."""
    pass

class VehicleAPIViewSet(BaseAPIViewSet):
    model = Vehicle
    def post(self, request):
        from rest_framework import serializers
        class VehicleSerializer(serializers.ModelSerializer):
            class Meta:
                model = Vehicle
                fields = '__all__'
        serializer = VehicleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MechanicAPIViewSet(BaseAPIViewSet):
    model = Mechanic

class ServiceJobAPIViewSet(BaseAPIViewSet):
    model = ServiceJob
    def post(self, request):
        from rest_framework import serializers
        class JobSerializer(serializers.ModelSerializer):
            class Meta:
                model = ServiceJob
                fields = '__all__'
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        try:
            instance = ServiceJob.objects.get(pk=pk)
        except ServiceJob.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        from rest_framework import serializers
        class JobSerializer(serializers.ModelSerializer):
            class Meta:
                model = ServiceJob
                fields = '__all__'
        serializer = JobSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InvoiceAPIViewSet(BaseAPIViewSet):
    model = Invoice
    def post(self, request):
        from rest_framework import serializers
        class InvoiceSerializer(serializers.ModelSerializer):
            class Meta:
                model = Invoice
                fields = '__all__'
        serializer = InvoiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AttendanceAPIViewSet(BaseWritableAPIViewSet):
    model = Attendance

class BonusRuleAPIViewSet(BaseAPIViewSet):
    model = BonusRule

class PayrollAPIViewSet(BaseWritableAPIViewSet):
    model = Payroll

class ShopAPIViewSet(BaseWritableAPIViewSet):
    model = Shop

class SeasonalOfferAPIViewSet(BaseAPIViewSet):
    model = SeasonalOffer

class InspectionBucketAPIViewSet(BaseAPIViewSet):
    model = InspectionBucket

class InventoryPartAPIViewSet(BaseWritableAPIViewSet):
    model = InventoryPart

class StockTransactionAPIViewSet(BaseWritableAPIViewSet):
    model = StockTransaction

class BiometricLogAPIViewSet(BaseWritableAPIViewSet):
    model = BiometricLog

class SalaryStructureAPIViewSet(BaseWritableAPIViewSet):
    model = SalaryStructure

class CommunityPostAPIViewSet(BaseWritableAPIViewSet):
    model = CommunityPost
    def post(self, request):
        from rest_framework import serializers
        class PostSerializer(serializers.ModelSerializer):
            class Meta:
                model = CommunityPost
                fields = '__all__'
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommunityCommentAPIViewSet(BaseWritableAPIViewSet):
    model = CommunityComment
    def post(self, request):
        from rest_framework import serializers
        class CommentSerializer(serializers.ModelSerializer):
            class Meta:
                model = CommunityComment
                fields = '__all__'
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Create the router. "wagtailapi" is the URL namespace
api_router = WagtailAPIRouter('wagtailapi')

# Add the three endpoints using the "register_endpoint" method.
api_router.register_endpoint('pages', PagesAPIViewSet)
api_router.register_endpoint('images', ImagesAPIViewSet)
api_router.register_endpoint('documents', DocumentsAPIViewSet)
api_router.register_endpoint('snippets', MaterialSnippetAPIViewSet)
api_router.register_endpoint('vehicles', VehicleAPIViewSet)
api_router.register_endpoint('mechanics', MechanicAPIViewSet)
api_router.register_endpoint('jobs', ServiceJobAPIViewSet)
api_router.register_endpoint('invoices', InvoiceAPIViewSet)
api_router.register_endpoint('attendance', AttendanceAPIViewSet)
api_router.register_endpoint('bonus_rules', BonusRuleAPIViewSet)
api_router.register_endpoint('payroll', PayrollAPIViewSet)
api_router.register_endpoint('shops', ShopAPIViewSet)
api_router.register_endpoint('offers', SeasonalOfferAPIViewSet)
api_router.register_endpoint('inspection_buckets', InspectionBucketAPIViewSet)
api_router.register_endpoint('inventory', InventoryPartAPIViewSet)
api_router.register_endpoint('stock-transactions', StockTransactionAPIViewSet)
api_router.register_endpoint('biometric-logs', BiometricLogAPIViewSet)
api_router.register_endpoint('salary-structures', SalaryStructureAPIViewSet)
api_router.register_endpoint('community-posts', CommunityPostAPIViewSet)
api_router.register_endpoint('community-comments', CommunityCommentAPIViewSet)
