import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Product } from '../Entities/product.model';
import { AuthenticationsService } from '../Services/authentications.service';
import { ProductsService } from '../Services/products.service';

@Component({
  selector: 'app-manageproducts',
  templateUrl: './manageproducts.component.html',
  styleUrls: ['./manageproducts.component.css']
})
export class ManageproductsComponent implements OnInit {

  public thisPage: string = "Store Books";
  public records: number[] = [8, 12, 16, 20, 24];
  public perPage: number = this.records[0];
  public page = 1;

  public isLoggedIn: boolean = false;
  public inProgress = false;
  public bulkInProgress = false;
  public bulkFileName = "";
  public btnDisable: boolean = true;

  alerts: { status: string, msg: string, for: string } = { status: "none", msg: "", for: "" };
  public distinctBrands: Product[] = [];
  public productsList: Product[] = [];

  public modalTitle!: string;
  public product: Product | undefined;
  public search: string = "";
  public type: String = "create";

  public selectedFiles!: FileList | any;
  public currentFile!: File | any;
  public progress = 0;
  public message = '';
  public fileInfos!: Observable<any>;

  constructor(private _authService: AuthenticationsService, private _productsService: ProductsService, private router: Router, private _activeRouter: ActivatedRoute) {
    this.fetchProducts();
    _activeRouter.params.subscribe((pages: any) => { this.getPathVariables(pages) });
  }

  ngOnInit(): void {
    this.fetchProducts();
    this._activeRouter.params.subscribe((pages: any) => { this.getPathVariables(pages) });
    if (this._authService.isLoggedIn()) {
      if (this._authService.getCurrentUser()?.acctype !== "admin") {
        this.router.navigate(['/dashboard']);
      }
    }
    this.isLoggedIn = this._authService.isLoggedIn();
  }

  fetchProducts() {
    this._productsService.getProducts().subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.productsList = data.products;
        }
      }
    );
  }

  selectPage(page: string) {
    this.page = parseInt(page, 10) || 1;
  }

  getPathVariables(pathVars: any) {
    if (pathVars.pageId != undefined) {
      this.page = pathVars.pageId;
    }
  }

  readJson(event: any) {
    var file = event.srcElement.files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = (e: Event) => {
        this.bulkUpdate(e);
      }
      reader.onerror = function (evt) {
        console.log('error reading file');
      }
    }
  }

  upload() {
    this.progress = 0;
    this.currentFile = this.selectedFiles.item(0);
    this._productsService.upload(this.currentFile).subscribe(
      (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          this.message = event.body.message;
          this.fileInfos = this._productsService.getFiles();
        }
      },
      (err: any) => {
        this.progress = 0;
        this.message = 'Could not upload the file!';
        this.currentFile = undefined;
      });
    this.selectedFiles = undefined;
  }
  selectFile(event: any) {
    this.selectedFiles = event.target.files;
  }

  bulkUpdate(file: any) {
    this.bulkInProgress = true;
    this._productsService.bulkUploadProducts(file.target.files.item(0)).subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.getProducts();
        }
        this.alerts.for = "bulkUpload";
        this.alerts.status = data.status;
        this.alerts.msg = data.msg;
        this.bulkInProgress = false;
      }
    )
  }

  loadProducts() {
    this.inProgress = true;
    this._productsService.getProducts().subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.productsList = data.products;
        }
        this.inProgress = false;
      },
      (err: any) => {
        this.inProgress = false;
      }
    )
  }

  setProductData(type: any, id: number, e: any) {
    this.inProgress = true;
    this._productsService.getProductById(id).subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.product = data.product;
        }
      },
      (err: HttpErrorResponse) => { }
    )
    this.inProgress = false;
  }

  createProduct(data: any) {
    this.inProgress = true;
    this.alerts.for = "create";
    this.product = new Product(this.productsList.length + 1, data.prdname, data.prdimage, data.prdprice, data.prdstock, data.prdcategory, data.prdbrandName);
    console.log(this.product);

    this._productsService.createProduct(this.product).subscribe(
      (data: any) => {
        console.log(data);
        
        if (data.status == "success") {
          this.product = data.product;
          this.getProducts();
        }
        this.alerts.msg = data.msg;
        this.alerts.status = data.status;
      },
      (err: HttpErrorResponse) => {
        this.alerts.msg = err.message;
        this.alerts.status = err.status + "";
        console.log(err);
      }
    )
    this.inProgress = false;
  }

  getProducts() {
    this.inProgress = true;
    this._productsService.getProducts().subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.productsList = data.products;
        }
      },
      (err: HttpErrorResponse) => {
        console.log(err);
      }
    )
    this.inProgress = false;
  }

  getBrandNames() {
    this.inProgress = true;
    this._productsService.getBrandNames().subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.distinctBrands = data.products;
        }
      },
      (err: HttpErrorResponse) => {
        console.log(err);
      }
    );
    this.inProgress = false;
  }

  updateProduct(data: any) {
    this.inProgress = true;
    this.alerts.for = "update";

    console.log(data);
    
    this.product = new Product(this.product?.pid, data?.name, data?.image, data?.price, data?.stock, data?.category, data?.brandName);

    this._productsService.updateProduct(this.product).subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.getProducts();
          alert(data.msg);
        }
      },
      (err: any) => {
      }
    )
    this.inProgress = false;
  }

  deleteProduct(id: number) {
    this.inProgress = true;
    this._productsService.deleteProduct(id).subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.productsList = data.products;
          this.loadProducts();
          alert(data.msg);
        }
        this.inProgress = false;
      },
      (err: any) => {
        this.inProgress = false;
      }
    )
  }

  searchProducts(): any {
    this.inProgress = true;
    if (this.search == "") {
      this.loadProducts();
      return 0;
    }
    this._productsService.searchProducts(this.search).subscribe(
      (data: any) => {
        if (data.status == "success") {
          this.productsList = data.products;
        }
        this.inProgress = false;
      },
      (err: any) => {
        this.inProgress = false;
      }
    )
  }

  // modifyWishlist(id: any) {
  //   this._productsService.modifyWishlist(id);
  // }

  // inWishlist(id: any): boolean {
  //   return this._productsService.inWishlist(id);
  // }

  // modifyCart(id: any) {
  //   this._productsService.modifyCart(id);
  // }

  // inCart(id: any): boolean {
  //   return this._productsService.inCart(id);
  // }

  openProductDetails(e: any, bid: any) {
    if (e.target.nodeName != 'BUTTON') {
      if (this.isLoggedIn) {
        this.router.navigate(['dashboard', 'products', bid]);
      } else {
        this.router.navigate(['products', bid]);
      }
    }
  }

}
